<!--
  内容区域（核心页面）：
  纵向 flex 布局，撑满整个主内容区
  从上到下依次为：
    1. 顶部留白 3vh
    2. 时间（大字号 24h 制）
    3. 日期（含农历）
    4. 搜索框（引擎下拉 + 输入框 + 搜索按钮 + 引擎"+"添加）
    5. 链接图标区（所有链接+占位卡片都在 draggable 内，支持拖拽排序 + 右键编辑/删除）
    6. 一言（底部固定）
    7. 全局右键菜单
-->
<template>
  <div class="content-area" @contextmenu.prevent="handleContentContextMenu">
    <!-- 中部弹性容器 -->
    <div class="content-inner">
      <!-- 顶部缓冲 3vh -->
      <div class="top-spacer" />

      <!-- 1. 时间 -->
      <div class="time-display">{{ timeStr }}</div>

      <!-- 2. 日期（含农历） -->
      <div class="date-display">{{ dateStr }}<span class="lunar-text">{{ lunarStr }}</span></div>

      <!-- 3. 搜索框 -->
      <div class="search-section">
        <el-select v-model="currentEngine" size="large" class="search-engine-select">
          <el-option
            v-for="eng in store.searchEngines"
            :key="eng.value"
            :label="eng.label"
            :value="eng.value"
          />
          <el-option class="add-engine-option" value="__add__" disabled>
            <div style="display:flex;align-items:center;gap:6px;color:var(--active-color)" @click.stop="showAddEngine = true">
              <el-icon :size="14"><Plus /></el-icon>
              <span>添加搜索引擎</span>
            </div>
          </el-option>
        </el-select>
        <el-input
          v-model="searchQuery"
          placeholder="搜索..."
          size="large"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button size="large" type="primary" class="search-btn" @click="handleSearch">
          <el-icon :size="20"><Search /></el-icon>
        </el-button>
      </div>

      <!-- 4. 链接图标区：所有卡片（含占位）都在 draggable 内，可拖拽排序 -->
      <div class="links-section">
        <VueDraggable
          v-model="currentLinks"
          class="links-grid"
          ghost-class="link-ghost"
          :animation="200"
          @end="handleLinkDragChange"
        >
          <div
            v-for="link in currentLinks"
            :key="link.id"
            class="link-card"
            @click="link.isAddPlaceholder ? openAddDialog() : openLink(link.url)"
            @contextmenu.prevent="handleLinkContextMenu($event, link)"
          >
            <template v-if="link.isAddPlaceholder">
              <!-- 占位"添加"链接：完全用普通链接样式，图标显示 +，名称显示"添加" -->
              <div class="link-icon-wrapper">
                <el-icon :size="28"><Plus /></el-icon>
              </div>
              <span class="link-name">添加</span>
            </template>
            <template v-else>
              <div class="link-icon-wrapper">
                <img v-if="link.icon" :src="link.icon" class="link-icon-img" alt="" />
                <el-icon v-else :size="28"><LinkIcon /></el-icon>
              </div>
              <span class="link-name">{{ link.name }}</span>
            </template>
          </div>
        </VueDraggable>

        <div v-if="currentLinks.length === 0 && store.activeGroup" class="links-empty">
          当前分组暂无链接
        </div>
      </div>

      <!-- 5. 底部一言 -->
      <div class="quote-section">{{ quoteText }}</div>
    </div>

    <!-- 添加/编辑链接弹窗 -->
    <AddLinkDialog
      v-if="showAddDialog"
      :link="editingLink"
      @close="closeAddDialog"
      @save="handleAddLink"
    />

    <!-- 添加搜索引擎弹窗 -->
    <div v-if="showAddEngine" class="add-engine-mask" @click.self="showAddEngine = false">
      <div class="add-engine-panel">
        <h3 class="panel-title">添加搜索引擎</h3>
        <div class="form-group">
          <label class="form-label">名称</label>
          <el-input v-model="newEngineLabel" placeholder="如：百度" maxlength="20" clearable />
        </div>
        <div class="form-group">
          <label class="form-label">搜索 URL 模板</label>
          <el-input v-model="newEngineUrl" placeholder="如：https://www.baidu.com/s?wd=" clearable />
          <p class="form-hint">网址中搜索词部分用 {q} 代替，如 https://example.com/search?q={q}</p>
        </div>
        <div class="panel-footer">
          <el-button size="small" @click="showAddEngine = false">取消</el-button>
          <el-button size="small" type="primary" @click="handleAddEngine" :disabled="!newEngineLabel || !newEngineUrl">
            添加
          </el-button>
        </div>
      </div>
    </div>

    <!-- 链接右键菜单（占位链接也支持右键编辑/删除） -->
    <div
      v-if="linkContextMenu.visible"
      class="context-menu"
      :style="{ top: linkContextMenu.y + 'px', left: linkContextMenu.x + 'px' }"
    >
      <div v-if="!linkContextMenu.link?.isAddPlaceholder" class="context-menu-item" @click="handleLinkEdit">
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </div>
      <div class="context-menu-item danger" @click="handleLinkDelete">
        <el-icon><Delete /></el-icon>
        <span>{{ linkContextMenu.link?.isAddPlaceholder ? '移除' : '删除' }}</span>
      </div>
    </div>

    <!-- 全局右键菜单（主内容区空白处右键） -->
    <div
      v-if="globalContextMenu.visible"
      class="context-menu"
      :style="{ top: globalContextMenu.y + 'px', left: globalContextMenu.x + 'px' }"
    >
      <div class="context-menu-item" @click="handleAddFromMenu">
        <el-icon><Plus /></el-icon>
        <span>添加图标</span>
      </div>
      <div class="context-menu-item" @click="handleSettings">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ContentArea 组件：主内容区域
 * 包含时间、日期（农历）、搜索、链接图标、一言、右键菜单
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Search, Link as LinkIcon, Plus, Edit, Delete, Setting } from '@element-plus/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useTabsStore } from '@/stores/tabs'
import type { Link } from '@/types/tab'
import AddLinkDialog from './AddLinkDialog.vue'
import { Solar } from 'lunar-javascript'

const store = useTabsStore()

// ============ 时间/日期/农历 ============
const timeStr = ref('')
const dateStr = ref('')
const lunarStr = ref('')
let timer: number | undefined

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function updateDateTime() {
  const now = new Date()
  timeStr.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekDay = weekDays[now.getDay()]
  dateStr.value = `${month}月${day}日 ${weekDay}`
  try {
    const solar = Solar.fromDate(now)
    const lunar = solar.getLunar()
    lunarStr.value = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
  } catch {
    lunarStr.value = ''
  }
}

onMounted(() => {
  updateDateTime()
  timer = window.setInterval(updateDateTime, 1000)
  document.addEventListener('click', closeAllContextMenus)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('click', closeAllContextMenus)
})

// ============ 搜索 ============
const currentEngine = ref(store.searchEngines[0]?.value || 'baidu')
const searchQuery = ref('')

function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  const engine = store.searchEngines.find(e => e.value === currentEngine.value)
  if (!engine) return
  const url = engine.url.includes('{q}')
    ? engine.url.replace('{q}', encodeURIComponent(q))
    : engine.url + encodeURIComponent(q)
  window.open(url, '_blank')
}

// ============ 添加搜索引擎 ============
const showAddEngine = ref(false)
const newEngineLabel = ref('')
const newEngineUrl = ref('')

function handleAddEngine() {
  if (!newEngineLabel.value || !newEngineUrl.value) return
  const value = newEngineLabel.value.toLowerCase().replace(/\s+/g, '')
  store.addSearchEngine(newEngineLabel.value, value, newEngineUrl.value)
  newEngineLabel.value = ''
  newEngineUrl.value = ''
  showAddEngine.value = false
}

// ============ 链接 ============
const showAddDialog = ref(false)
const editingLink = ref<Link | undefined>()

const currentLinks = ref(store.currentLinks)

watch(() => store.currentLinks, (val) => {
  currentLinks.value = [...val]
}, { immediate: true, deep: true })

function openLink(url: string) {
  if (!url) return
  window.open(url.startsWith('http') ? url : 'https://' + url, '_blank')
}

function openAddDialog() {
  editingLink.value = undefined
  showAddDialog.value = true
}

function handleAddLink(data: { name: string; url: string; icon: string; id?: string }) {
  if (data.id) {
    store.updateLink(data.id, { name: data.name, url: data.url, icon: data.icon })
  } else {
    store.addLink(data.name, data.url, data.icon)
  }
  currentLinks.value = [...store.currentLinks]
  closeAddDialog()
}

function closeAddDialog() {
  showAddDialog.value = false
  editingLink.value = undefined
}

function handleLinkDragChange() {
  // currentLinks 已被 VueDraggable 重新排序，直接用它更新数据库
  store.updateLinkOrder(currentLinks.value)
}

// ============ 链接右键菜单 ============
const linkContextMenu = ref<{
  visible: boolean
  x: number; y: number
  link: Link | null
}>({ visible: false, x: 0, y: 0, link: null })

function handleLinkContextMenu(event: MouseEvent, link: Link) {
  event.stopPropagation()
  globalContextMenu.value.visible = false
  linkContextMenu.value = { visible: true, x: event.clientX, y: event.clientY, link }
}

function handleLinkEdit() {
  const link = linkContextMenu.value.link
  if (link) {
    editingLink.value = link
    showAddDialog.value = true
  }
  linkContextMenu.value.visible = false
}

function handleLinkDelete() {
  const link = linkContextMenu.value.link
  if (link) {
    store.deleteLink(link.id)
    currentLinks.value = [...store.currentLinks]
  }
  linkContextMenu.value.visible = false
}

// ============ 全局右键菜单 ============
const globalContextMenu = ref<{
  visible: boolean
  x: number; y: number
}>({ visible: false, x: 0, y: 0 })

function handleContentContextMenu(event: MouseEvent) {
  linkContextMenu.value.visible = false
  globalContextMenu.value = { visible: true, x: event.clientX, y: event.clientY }
}

function handleAddFromMenu() {
  globalContextMenu.value.visible = false
  openAddDialog()
}

function handleSettings() {
  globalContextMenu.value.visible = false
  store.showSettings = true
}

// ============ 关闭所有右键菜单 ============
function closeAllContextMenus() {
  linkContextMenu.value.visible = false
  globalContextMenu.value.visible = false
}

// ============ 一言 ============
const quoteText = '— 生活明朗，万物可爱 —'
</script>

<style scoped>
/* 主容器：不整体滚动，由 links-section 内部滚动 */
.content-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  overflow: hidden;
}

.content-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow: hidden;
  padding: 0 20px;
}

.top-spacer { height: 3vh; flex-shrink: 0; }

.time-display {
  font-size: 72px;
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: 4px;
  line-height: 1.1;
  margin-bottom: 8px;
}

.date-display {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 36px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.lunar-text {
  font-size: 16px;
  color: var(--text-secondary);
}

.search-section {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 36px;
}

.search-engine-select { width: 130px; }
.search-engine-select :deep(.el-input__wrapper) {
  border-radius: 24px 0 0 24px !important;
  border-right: none !important;
}

.search-input { width: 360px; }
.search-input :deep(.el-input__wrapper) { border-radius: 0 !important; }

.search-btn {
  border-radius: 0 24px 24px 0 !important;
  height: 40px;
}

/* 链接区域：可滚动，隐藏滚动条 */
.links-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 36px;
  width: 100%;
  max-width: 600px;
  flex-shrink: 1;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.links-section::-webkit-scrollbar { display: none; }

.links-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 18px;
  min-height: 60px;
}

.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px;
  border-radius: 18px;
}

.link-card:hover { background: var(--hover-bg); }

.link-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  overflow: hidden;
  transition: all 0.2s;
}

.link-card:hover .link-icon-wrapper {
  background: var(--active-bg);
  color: var(--active-color);
}

.link-icon-img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 18px;
}

.link-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-ghost {
  opacity: 0.3;
  background: var(--hover-bg);
  border-radius: 18px;
}

.links-empty {
  font-size: 13px;
  color: var(--text-hint);
  margin-top: 12px;
}

/* 一言 */
.quote-section {
  font-size: 16px;
  color: var(--text-hint);
  font-style: italic;
  letter-spacing: 2px;
  margin-top: auto;
  padding-bottom: 3vh;
  flex-shrink: 0;
}

/* ========== 通用右键菜单样式 ========== */
.context-menu {
  position: fixed;
  z-index: 1000;
  background: var(--panel-bg);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  padding: 4px;
  min-width: 120px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background 0.15s;
}

.context-menu-item:hover { background-color: var(--context-menu-hover); }

.context-menu-item.danger { color: var(--danger-color); }
.context-menu-item.danger:hover { background-color: var(--danger-hover-bg); }

/* ========== 添加搜索引擎弹窗样式 ========== */
.add-engine-mask {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: var(--mask-bg);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-engine-panel {
  width: 420px;
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px var(--shadow-color);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.form-group { margin-bottom: 16px; }

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}

.form-hint {
  font-size: 12px;
  color: var(--text-hint);
  margin-top: 4px;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
