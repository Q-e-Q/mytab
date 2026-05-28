<!--
  侧边栏组件：
  - 展示全部分组卡片（图标+名称），点击切换选中
  - 支持拖拽排序（vue-draggable-plus）
  - 右键菜单可编辑/删除分组
  - 分组列表末尾有"+"卡片新建分组
  - 底部仅设置按钮（深色模式移动到设置弹窗中）
-->
<template>
  <!-- 侧边栏容器：纵向排列，撑满父元素高度 -->
  <div class="sidebar-container" :style="{ '--sidebar-opacity': store.sidebarOpacity / 100 }">
    <!-- 分组列表区域：可滚动 -->
    <div class="group-list">
      <!--
        VueDraggable：可拖拽排序组件
        v-model 绑定 store 中的 groups 列表，拖拽自动更新顺序
        ghost-class 指定拖动时占位元素的样式名
        animation 指定动画时长（毫秒）
        @change 在拖拽排序完成后触发
      -->
      <VueDraggable
        v-model="store.groups"
        class="group-draggable"
        ghost-class="ghost"
        :animation="200"
        @end="handleDragChange"
      >
        <!--
          遍历每个分组，渲染卡片
          @click 点击切换选中分组
          @contextmenu.prevent 右键弹出菜单（阻止默认浏览器右键菜单）
        -->
        <div
          v-for="group in store.groups"
          :key="group.id"
          class="group-item"
          :class="{ active: store.activeGroupId === group.id }"
          @click="store.setActiveGroup(group.id)"
          @contextmenu.prevent="handleContextMenu($event, group)"
        >
          <!-- 分组图标：动态渲染 Element Plus 图标组件 -->
          <div class="group-icon">
            <el-icon :size="32">
              <!-- getIconComponent 根据图标名字符串获取对应的组件 -->
              <component :is="getIconComponent(group.icon)" />
            </el-icon>
          </div>
          <!-- 分组名称 -->
          <div class="group-name">{{ group.name }}</div>
        </div>
      </VueDraggable>

      <!--
        "+" 新建分组卡片：始终在分组列表末尾
        点击打开新建分组弹窗
      -->
      <div class="group-item add-card" @click="openAddDialog()">
        <div class="group-icon add-icon">
          <el-icon :size="28"><Plus /></el-icon>
        </div>
        <div class="group-name">新建</div>
      </div>
    </div>

    <!-- 底部固定区域：仅设置按钮（深色模式移到了设置弹窗中） -->
    <div class="sidebar-footer">
      <el-button
        :icon="Setting"
        circle
        size="small"
        class="footer-btn"
        @click="store.showSettings = true"
      />
    </div>

    <!-- 右键菜单浮层 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div class="context-menu-item" @click="handleEdit">
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </div>
      <div class="context-menu-item danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>

    <!-- 新建/编辑分组弹窗 -->
    <GroupEditDialog
      v-if="showEditDialog"
      :group="editingGroup"
      @close="closeEditDialog"
      @save="handleSave"
    />

    <!-- 设置弹窗（使用 Teleport 渲染到 body，避免父级 stacking context 影响 z-index） -->
    <Teleport to="body">
      <SettingsDialog
        v-if="store.showSettings"
        @close="store.showSettings = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 侧边栏组件：
 * - 展示全部分组，支持拖拽排序
 * - 右键菜单编辑/删除
 * - 底部设置按钮（深色模式切换移入设置弹窗）
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
// 注：移除了 Moon/Sunny 图标导入，因为深色切换按钮移到设置弹窗内
import { Plus, Edit, Delete, Setting } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'
import type { Group } from '@/types/tab'
import GroupEditDialog from './GroupEditDialog.vue'
import SettingsDialog from './SettingsDialog.vue'

const store = useTabsStore()

// === 右键菜单状态 ===
const contextMenu = ref<{
  visible: boolean
  x: number; y: number
  group: Group | null
}>({ visible: false, x: 0, y: 0, group: null })

// === 编辑弹窗状态 ===
const showEditDialog = ref(false)
const editingGroup = ref<{ id: string; name: string; icon: string } | undefined>()

// ---- 生命周期钩子 ----
onMounted(() => {
  store.loadGroups()
  document.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})

// ---- 工具函数 ----
function getIconComponent(iconName: string) {
  return (Icons as any)[iconName] || Icons.Folder
}

// ---- 右键菜单处理 ----
function handleContextMenu(event: MouseEvent, group: Group) {
  // 根据侧边栏位置调整菜单弹出方向
  // 侧边栏在右侧时，菜单应该向左展开（相对于点击位置偏移菜单宽度）
  const menuWidth = 140
  const x = store.sidebarPosition === 'right'
    ? event.clientX - menuWidth
    : event.clientX
  contextMenu.value = { visible: true, x, y: event.clientY, group }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

function handleEdit() {
  const group = contextMenu.value.group
  if (group) {
    editingGroup.value = { id: group.id, name: group.name, icon: group.icon }
    showEditDialog.value = true
  }
  closeContextMenu()
}

function handleDelete() {
  const group = contextMenu.value.group
  if (group) store.deleteGroup(group.id)
  closeContextMenu()
}

// ---- 编辑弹窗处理 ----
function openAddDialog() {
  editingGroup.value = undefined
  showEditDialog.value = true
}

function closeEditDialog() {
  showEditDialog.value = false
  editingGroup.value = undefined
}

function handleSave(data: { name: string; icon: string }) {
  if (editingGroup.value) {
    store.updateGroup(editingGroup.value.id, data)
  } else {
    store.addGroup(data.name, data.icon)
  }
  closeEditDialog()
}

function handleDragChange() {
  store.updateOrder(store.groups)
}
</script>

<style scoped>
/* 侧边栏容器：纵向排列，占满父容器高度 */
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* 背景层伪元素：仅背景半透明，内部图标/文字保持 100% 不模糊 */
.sidebar-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: var(--bg-secondary);
  opacity: var(--sidebar-opacity, 1);
  pointer-events: none;
  z-index: 0;
}

/* 确保所有直接子元素在背景层之上 */
.sidebar-container > * {
  position: relative;
  z-index: 1;
}

.group-list {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.group-list::-webkit-scrollbar { display: none; }

.group-draggable {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  background: transparent;
}

.group-item:hover {
  background-color: var(--hover-bg);
}

.group-item.active {
  background-color: var(--active-bg);
}

.group-item.active .group-icon { color: var(--active-color); }

.group-item.active .group-name {
  color: var(--active-color);
  font-weight: 600;
}

.add-card {
  border: 1px dashed var(--border-color);
  opacity: 0.7;
  transition: all 0.2s;
}

.add-card:hover {
  border-color: var(--active-color);
  opacity: 1;
  background-color: var(--hover-bg);
}

.add-icon {
  color: var(--text-hint) !important;
}

.add-card:hover .add-icon {
  color: var(--active-color) !important;
}

.group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px; height: 60px;
  border-radius: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.group-item:hover .group-icon { color: var(--active-color); }

.group-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.3;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.ghost {
  opacity: 0.4;
  background: var(--hover-bg) !important;
  border-radius: 10px;
}

.sidebar-footer {
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.footer-btn {
  color: var(--text-secondary) !important;
  --el-button-bg-color: transparent !important;
  --el-button-border-color: var(--border-color) !important;
  --el-button-hover-bg-color: var(--hover-bg) !important;
  --el-button-hover-border-color: var(--active-color) !important;
  --el-button-hover-text-color: var(--active-color) !important;
}

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

.context-menu-item.danger {
  color: var(--danger-color);
}

.context-menu-item.danger:hover { background-color: var(--danger-hover-bg); }
</style>
