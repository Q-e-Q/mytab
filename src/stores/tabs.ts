/**
 * 状态管理层：Pinia Store
 * 管理分组列表、链接列表、当前选中分组、深色模式（三态）、侧边栏设置、搜索引擎列表
 * 所有修改自动同步到 IndexedDB 或 localStorage
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Group, Link, SearchEngine } from '@/types/tab'
import { groupDB, linkDB } from '@/db'

/** 默认搜索引擎列表 */
const DEFAULT_ENGINES: SearchEngine[] = [
  { label: '百度', value: 'baidu', url: 'https://www.baidu.com/s?wd=' },
  { label: 'Google', value: 'google', url: 'https://www.google.com/search?q=' },
  { label: 'Bing', value: 'bing', url: 'https://www.bing.com/search?q=' },
  { label: '搜狗', value: 'sogou', url: 'https://www.sogou.com/web?query=' },
]

/** 默认"首页"分组的链接 */
const DEFAULT_LINKS = [
  { name: '百度', url: 'https://www.baidu.com', icon: '' },
  { name: '知乎', url: 'https://www.zhihu.com', icon: '' },
  { name: 'B站', url: 'https://www.bilibili.com', icon: '' },
  { name: 'GitHub', url: 'https://github.com', icon: '' },
  { name: '掘金', url: 'https://juejin.cn', icon: '' },
]

export const useTabsStore = defineStore('tabs', () => {

  // ============ 分组与链接状态 ============
  const groups = ref<Group[]>([])               // 全部分组
  const activeGroupId = ref<string | null>(null) // 当前选中分组 ID
  const links = ref<Link[]>([])                  // 全部链接

  // ============ 深色模式（三态：light / dark / system）============
  const themeMode = ref<'light' | 'dark' | 'system'>(
    (localStorage.getItem('themeMode') as 'light' | 'dark' | 'system') || 'system'
  )

  /** 根据 themeMode 计算实际是否为深色 */
  const isDark = computed(() => {
    if (themeMode.value === 'system') {
      // 跟随系统：检查 prefers-color-scheme
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return themeMode.value === 'dark'
  })

  /** 监听 isDark 变化，同步到 html 标签 */
  watch(isDark, (dark) => {
    document.documentElement.classList.toggle('dark', dark)
  }, { immediate: true })

  // ============ 弹窗控制 ============
  /** 控制设置弹窗显示（可由 Sidebar 和 ContentArea 通用控制） */
  const showSettings = ref(false)

  // ============ 侧边栏设置 ============
  /** 侧边栏位置：'left' 或 'right' */
  const sidebarPosition = ref< 'left' | 'right'>(
    (localStorage.getItem('sidebarPosition') as 'left' | 'right') || 'left'
  )
  /** 侧边栏宽度：42~120px，默认 120px */
  const sidebarWidth = ref(
    Number(localStorage.getItem('sidebarWidth')) || 120
  )
  /** 侧边栏背景不透明度：10~100（对应 0.10~1.00），默认 100 */
  const sidebarOpacity = ref(
    Number(localStorage.getItem('sidebarOpacity')) || 100
  )

  /** 监视侧边栏设置变化，保存到 localStorage */
  watch(sidebarPosition, (v) => localStorage.setItem('sidebarPosition', v))
  watch(sidebarWidth, (v) => localStorage.setItem('sidebarWidth', String(v)))
  watch(sidebarOpacity, (v) => localStorage.setItem('sidebarOpacity', String(v)))

  // ============ 搜索引擎列表 ============
  /** 搜索引擎列表，存储在 localStorage */
  const searchEngines = ref<SearchEngine[]>(
    JSON.parse(localStorage.getItem('searchEngines') || JSON.stringify(DEFAULT_ENGINES))
  )

  watch(searchEngines, (v) => {
    localStorage.setItem('searchEngines', JSON.stringify(v))
  }, { deep: true })

  // ============ 计算属性 ============
  const activeGroup = computed(() => {
    return groups.value.find(g => g.id === activeGroupId.value) || null
  })

  /** 当前选中分组下的链接 */
  const currentLinks = computed(() => {
    return links.value.filter(l => l.groupId === activeGroupId.value)
  })

  // ============ 监听：切换分组时加载链接 ============
  watch(activeGroupId, (newId) => {
    if (newId) loadLinks(newId)
  })

  // ============ 分组操作方法 ============

  /** 从数据库加载全部分组，首次使用时创建默认数据 */
  async function loadGroups() {
    let allGroups = await groupDB.getAll()
    if (allGroups.length === 0) {
      // 首次使用：创建"首页"分组和默认链接
      const homeGroup: Group = {
        id: crypto.randomUUID(),
        name: '首页',
        icon: 'Home',
        order: 0,
        createdAt: Date.now()
      }
      await groupDB.add(homeGroup)
      for (let i = 0; i < DEFAULT_LINKS.length; i++) {
        const link: Link = {
          id: crypto.randomUUID(),
          ...DEFAULT_LINKS[i],
          groupId: homeGroup.id,
          order: i
        }
        await linkDB.add(link)
      }
      allGroups = [homeGroup]
    }
    groups.value = allGroups
    if (groups.value.length > 0 && !activeGroupId.value) {
      activeGroupId.value = groups.value[0].id
    }
  }

  /** 加载指定分组的链接 */
  async function loadLinks(groupId: string) {
    const groupLinks = await linkDB.getByGroup(groupId)
    const otherLinks = links.value.filter(l => l.groupId !== groupId)
    links.value = [...otherLinks, ...groupLinks]
  }

  /** 新建分组（自动创建"添加"占位链接） */
  async function addGroup(name: string, icon: string) {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      icon,
      order: groups.value.length,
      createdAt: Date.now()
    }
    await groupDB.add(newGroup)
    groups.value.push(newGroup)
    activeGroupId.value = newGroup.id
    // 为新建分组自动创建占位链接
    await ensurePlaceholderLink(newGroup.id)
  }

  /** 更新分组 */
  async function updateGroup(id: string, data: Partial<Group>) {
    await groupDB.update(id, data)
    const index = groups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      groups.value[index] = { ...groups.value[index], ...data }
    }
  }

  /** 删除分组（同时删除该分组下所有链接） */
  async function deleteGroup(id: string) {
    await linkDB.deleteByGroup(id)
    await groupDB.delete(id)
    groups.value = groups.value.filter(g => g.id !== id)
    links.value = links.value.filter(l => l.groupId !== id)
    if (activeGroupId.value === id) {
      activeGroupId.value = groups.value.length > 0 ? groups.value[0].id : null
    }
  }

  /** 拖拽排序 */
  async function updateOrder(newGroups: Group[]) {
    const updated = newGroups.map((g, index) => ({ ...g, order: index }))
    groups.value = updated
    await groupDB.updateOrder(updated)
  }

  /** 切换选中分组 */
  function setActiveGroup(id: string) {
    activeGroupId.value = id
  }

  // ============ 占位链接管理 ============

  /** 确保指定分组存在一个"添加"占位链接 */
  async function ensurePlaceholderLink(groupId: string) {
    const exists = links.value.some(l => l.groupId === groupId && l.isAddPlaceholder)
    if (exists) return
    const groupLinks = links.value.filter(l => l.groupId === groupId)
    const placeholder: Link = {
      id: crypto.randomUUID(),
      name: '',
      url: '',
      icon: '',
      groupId,
      order: groupLinks.length,
      isAddPlaceholder: true
    }
    await linkDB.add(placeholder)
    links.value.push(placeholder)
  }

  // ============ 链接操作方法 ============

  /** 添加链接到当前分组（不替换占位，占位仅通过右键删除） */
  async function addLink(name: string, url: string, icon: string) {
    if (!activeGroupId.value) return
    const groupLinks = links.value.filter(l => l.groupId === activeGroupId.value)
    const newLink: Link = {
      id: crypto.randomUUID(),
      name,
      url,
      icon,
      groupId: activeGroupId.value,
      order: groupLinks.length
    }
    await linkDB.add(newLink)
    links.value.push(newLink)
  }

  /** 删除链接 */
  async function deleteLink(id: string) {
    await linkDB.delete(id)
    links.value = links.value.filter(l => l.id !== id)
  }

  /** 更新链接内容（名称、网址、图标） */
  async function updateLink(id: string, data: { name: string; url: string; icon: string }) {
    await linkDB.update(id, data)
    const idx = links.value.findIndex(l => l.id === id)
    if (idx !== -1) {
      links.value[idx] = { ...links.value[idx], ...data }
    }
  }

  /** 更新链接排序（拖拽后调用） */
  async function updateLinkOrder(newLinks: Link[]) {
    for (let i = 0; i < newLinks.length; i++) {
      newLinks[i].order = i
    }
    // 更新内存
    const groupId = newLinks[0]?.groupId
    if (groupId) {
      links.value = links.value.filter(l => l.groupId !== groupId)
      links.value.push(...newLinks)
    }
    // 批量更新数据库
    await linkDB.updateOrder(newLinks)
  }

  // ============ 深色模式 ============
  /** 设置主题模式：'light' | 'dark' | 'system' */
  function setThemeMode(mode: 'light' | 'dark' | 'system') {
    themeMode.value = mode
    localStorage.setItem('themeMode', mode)
  }

  // ============ 搜索引擎 ============
  /** 添加搜索引擎 */
  function addSearchEngine(label: string, value: string, url: string) {
    searchEngines.value.push({ label, value, url })
  }

  /** 删除搜索引擎 */
  function removeSearchEngine(value: string) {
    searchEngines.value = searchEngines.value.filter(e => e.value !== value)
  }

  return {
    // 分组与链接
    groups, activeGroupId, activeGroup, isDark,
    links, currentLinks,
    loadGroups, loadLinks, addGroup, updateGroup, deleteGroup,
    updateOrder, setActiveGroup,
    addLink, deleteLink, updateLink, updateLinkOrder, ensurePlaceholderLink,

    // 主题
    themeMode, setThemeMode,

    // 侧边栏
    sidebarPosition, sidebarWidth, sidebarOpacity,

    // 弹窗控制
    showSettings,

    // 搜索引擎
    searchEngines, addSearchEngine, removeSearchEngine,
  }
})
