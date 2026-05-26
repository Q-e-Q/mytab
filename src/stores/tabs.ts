/**
 * 状态管理层：Pinia Store
 * 管理分组列表和当前选中分组，所有修改自动同步到 IndexedDB
 */
import { defineStore } from 'pinia'             // Pinia 状态管理库
import { ref, computed } from 'vue'             // Vue 响应式 API
import type { Group } from '@/types/tab'        // 分组类型
import { groupDB } from '@/db'                  // 数据库操作对象

export const useTabsStore = defineStore('tabs', () => { // 定义名为 'tabs' 的 Store

  // ============ 状态 ============
  const groups = ref<Group[]>([])                // 全部分组列表（响应式数组）
  const activeGroupId = ref<string | null>(null) // 当前选中的分组 ID（可为 null）

  // 深色模式状态，从 localStorage 初始化
  const isDark = ref(document.documentElement.classList.contains('dark'))

  // ============ 计算属性 ============
  const activeGroup = computed(() => {           // 根据 activeGroupId 计算出当前分组对象
    return groups.value.find(g => g.id === activeGroupId.value) || null // 没找到返回 null
  })

  // ============ 操作方法 ============

  /** 从数据库加载全部分组，若无选中则默认选中第一个 */
  async function loadGroups() {                 // 异步加载
    groups.value = await groupDB.getAll()        // 从 IndexedDB 获取全部分组
    if (groups.value.length > 0 && !activeGroupId.value) { // 有分组但未选中
      activeGroupId.value = groups.value[0].id  // 默认选中第一个
    }
  }

  /** 新建分组，自动选中 */
  async function addGroup(name: string, icon: string) { // 接收名称和图标名
    const newGroup: Group = {                    // 构造新分组对象
      id: crypto.randomUUID(),                   // 生成唯一 ID
      name,                                      // 分组名称
      icon,                                      // 图标名称字符串
      order: groups.value.length,                // 排在最后（索引值 = 当前数量）
      createdAt: Date.now()                      // 当前时间戳
    }
    await groupDB.add(newGroup)                  // 写入数据库
    groups.value.push(newGroup)                  // 追加到响应式列表
    activeGroupId.value = newGroup.id            // 自动选中新分组
  }

  /** 更新指定分组的名称或图标 */
  async function updateGroup(id: string, data: Partial<Group>) { // 按 id 更新
    await groupDB.update(id, data)               // 更新数据库
    const index = groups.value.findIndex(g => g.id === id) // 找到在列表中的索引
    if (index !== -1) {                          // 如果找到了
      groups.value[index] = { ...groups.value[index], ...data } // 合并更新响应式数据
    }
  }

  /** 删除指定分组，若删除的是当前选中则自动切到第一个 */
  async function deleteGroup(id: string) {       // 按 id 删除
    await groupDB.delete(id)                     // 从数据库删除
    groups.value = groups.value.filter(g => g.id !== id) // 从响应式列表过滤掉
    if (activeGroupId.value === id) {            // 如果删的是当前选中的
      activeGroupId.value = groups.value.length > 0 ? groups.value[0].id : null // 切到第一个或 null
    }
  }

  /** 拖拽排序后批量更新 order 字段 */
  async function updateOrder(newGroups: Group[]) { // 接收拖拽后的新顺序
    const updated = newGroups.map((g, index) => ({ ...g, order: index })) // 按位置赋予新 order
    groups.value = updated                       // 更新响应式列表
    await groupDB.updateOrder(updated)           // 同步到数据库
  }

  /** 切换选中分组 */
  function setActiveGroup(id: string) {          // 设置当前选中的分组 ID
    activeGroupId.value = id
  }

  /** 切换深色模式，持久化到 localStorage */
  function toggleDark() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('isDark', String(isDark.value))
  }

  // 导出所有属性和方法供组件使用
  return {
    groups, activeGroupId, activeGroup, isDark,   // 响应式状态和计算属性
    loadGroups, addGroup, updateGroup, deleteGroup, updateOrder, setActiveGroup, toggleDark // 操作方法
  }
})
