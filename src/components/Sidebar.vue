<!--
  侧边栏组件：
  - 展示全部分组卡片（图标+名称），点击切换选中
  - 支持拖拽排序（vue-draggable-plus）
  - 右键菜单可编辑/删除分组
  - 分组列表末尾有"+"卡片新建分组
  - 底部深色模式切换 + 设置按钮
-->
<template>
  <!-- 侧边栏容器：纵向排列，撑满父元素高度 -->
  <div class="sidebar-container">
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
        @change="handleDragChange"
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
            <el-icon :size="28">
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

      <!-- 空状态：当 groups 长度为 0 时显示（"+"卡片已单独存在，此状态补充提示） -->
      <div v-if="store.groups.length === 0" class="empty-state">
        <el-empty description="点击下方 + 新建分组" :image-size="60" />
      </div>
    </div>

    <!-- 底部固定区域：深色模式切换 + 设置按钮 -->
    <div class="sidebar-footer">
      <!-- 深色模式切换按钮 -->
      <el-button
        :icon="store.isDark ? Moon : Sunny"
        circle
        size="small"
        class="footer-btn"
        @click="store.toggleDark()"
      />
      <!-- 设置按钮（功能暂定） -->
      <el-button
        :icon="Setting"
        circle
        size="small"
        class="footer-btn"
      />
    </div>

    <!--
      右键菜单：当 contextMenu.visible 为 true 时显示
      使用 position: fixed 定位在鼠标点击位置
    -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <!-- 编辑按钮 -->
      <div class="context-menu-item" @click="handleEdit">
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </div>
      <!-- 删除按钮（红色警示色） -->
      <div class="context-menu-item danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>

    <!--
      新建/编辑分组弹窗组件
      v-if="showEditDialog" 控制显示/隐藏
      :group="editingGroup" 编辑模式传入当前分组，新建模式为 undefined
      @close 关闭弹窗
      @save 保存并处理新建或编辑逻辑
    -->
    <GroupEditDialog
      v-if="showEditDialog"
      :group="editingGroup"
      @close="closeEditDialog"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
// 导入 Vue 生命周期和响应式 API
import { ref, onMounted, onUnmounted } from 'vue'
// 导入拖拽排序组件
import { VueDraggable } from 'vue-draggable-plus'
// 导入 Element Plus 图标组件：加号、编辑、删除、月亮、太阳、设置
import { Plus, Edit, Delete, Moon, Sunny, Setting } from '@element-plus/icons-vue'
// 导入所有 Element Plus 图标，用于动态获取图标组件
import * as Icons from '@element-plus/icons-vue'
// 导入 Pinia Store
import { useTabsStore } from '@/stores/tabs'
// 导入分组类型
import type { Group } from '@/types/tab'
// 导入分组编辑弹窗组件
import GroupEditDialog from './GroupEditDialog.vue'

// 获取 Store 实例
const store = useTabsStore()

// === 右键菜单状态 ===
const contextMenu = ref<{
  visible: boolean        // 是否显示
  x: number; y: number    // 菜单位置（视口坐标）
  group: Group | null     // 被右键点击的分组
}>({ visible: false, x: 0, y: 0, group: null })

// === 编辑弹窗状态 ===
const showEditDialog = ref(false)                // 是否显示弹窗
const editingGroup = ref<{ id: string; name: string; icon: string } | undefined>() // 编辑中的分组

// ---- 生命周期钩子 ----
onMounted(() => {
  store.loadGroups()                             // 组件挂载时从数据库加载分组
  document.addEventListener('click', closeContextMenu) // 全局点击关闭右键菜单
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu) // 组件卸载时移除全局监听
})

// ---- 工具函数 ----

/** 根据图标名称字符串获取对应的 Element Plus 图标组件 */
function getIconComponent(iconName: string) {
  return (Icons as any)[iconName] || Icons.Folder // 找不到就用 Folder 图标兜底
}

// ---- 右键菜单处理 ----

/** 右键点击分组时显示菜单（记录鼠标位置和目标分组） */
function handleContextMenu(event: MouseEvent, group: Group) {
  contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, group }
}

/** 关闭右键菜单（置为不可见） */
function closeContextMenu() {
  contextMenu.value.visible = false
}

/** 编辑：打开编辑弹窗，将当前分组数据传入 */
function handleEdit() {
  const group = contextMenu.value.group          // 获取被右键的分组
  if (group) {
    editingGroup.value = { id: group.id, name: group.name, icon: group.icon } // 传入编辑数据
    showEditDialog.value = true                  // 显示弹窗
  }
  closeContextMenu()                             // 关闭右键菜单
}

/** 删除：从 Store 和数据库删除当前分组 */
function handleDelete() {
  const group = contextMenu.value.group          // 获取被右键的分组
  if (group) store.deleteGroup(group.id)         // 调用 Store 的删除方法
  closeContextMenu()                             // 关闭右键菜单
}

// ---- 编辑弹窗处理 ----

/** 打开新建分组弹窗（不传 group 表示新建模式，面板自动垂直居中） */
function openAddDialog() {
  editingGroup.value = undefined                 // 清空编辑数据 → 新建模式
  showEditDialog.value = true                    // 显示弹窗
}

/** 关闭编辑弹窗并清空编辑数据 */
function closeEditDialog() {
  showEditDialog.value = false
  editingGroup.value = undefined
}

/**
 * 保存分组数据
 * 编辑模式 → 调用 updateGroup 更新
 * 新建模式 → 调用 addGroup 创建
 */
function handleSave(data: { name: string; icon: string }) {
  if (editingGroup.value) {                      // 有 editingGroup → 编辑模式
    store.updateGroup(editingGroup.value.id, data) // 更新现有分组
  } else {                                       // 无 editingGroup → 新建模式
    store.addGroup(data.name, data.icon)         // 创建新分组
  }
  closeEditDialog()                              // 关闭弹窗
}

/** 拖拽排序完成后同步到数据库 */
function handleDragChange() {
  store.updateOrder(store.groups)                // 将拖拽后的新顺序保存到数据库
}
</script>

<style scoped>
/* 侧边栏容器：纵向排列，占满父容器高度 */
.sidebar-container {
  display: flex;                /* 弹性布局 */
  flex-direction: column;       /* 纵向排列 */
  height: 100%;                 /* 撑满 */
  position: relative;           /* 相对定位 */
}

/* 分组列表容器：弹性伸缩占满剩余空间，可纵向滚动，但隐藏滚动条 */
.group-list {
  flex: 1;                      /* 占满剩余高度 */
  padding: 12px 10px;           /* 上下 12px 左右 10px 内边距 */
  overflow-y: auto;             /* 内容超出时纵向滚动 */
  display: flex;                /* 弹性布局 */
  flex-direction: column;       /* 纵向排列 */
  gap: 4px;                     /* 卡片间距 */
  scrollbar-width: none;        /* Firefox：隐藏滚动条 */
  -ms-overflow-style: none;     /* IE/Edge：隐藏滚动条 */
}

/* Chrome/Safari：隐藏滚动条 */
.group-list::-webkit-scrollbar { display: none; }

/* 拖拽区域内部的弹性布局 */
.group-draggable {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 单个分组卡片：上部图标 + 下部名称，纵向排列 */
.group-item {
  display: flex;                /* 弹性布局 */
  flex-direction: column;       /* 纵向排列（图标在上，名称在下） */
  align-items: center;          /* 水平居中 */
  gap: 4px;                     /* 图标和名称间距 */
  padding: 12px 8px 8px;        /* 内边距：上 12px 左右 8px 下 8px */
  border-radius: 10px;          /* 圆角 */
  cursor: pointer;              /* 鼠标变成手型 */
  transition: all 0.2s;         /* 悬停动画 */
  user-select: none;            /* 禁止选中文本（拖拽时避免文字被选中） */
  background: transparent;      /* 默认透明背景 */
}

/* 悬停时显示浅色背景 */
.group-item:hover {
  background-color: var(--hover-bg);
}

/* 选中状态：浅色背景 + 品牌色文字 */
.group-item.active {
  background-color: var(--active-bg);
}

/* 选中时图标变品牌色 */
.group-item.active .group-icon { color: var(--active-color); }

/* 选中时名称变品牌色加粗 */
.group-item.active .group-name {
  color: var(--active-color);
  font-weight: 600;
}

/* 新建卡片：虚线边框 + 视觉区分 */
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

/* 新建图标的容器颜色 */
.add-icon {
  color: var(--text-hint) !important;
}

.add-card:hover .add-icon {
  color: var(--active-color) !important;
}

/* 图标容器：固定尺寸，居中 */
.group-icon {
  display: flex;                /* 弹性布局 */
  align-items: center;          /* 垂直居中 */
  justify-content: center;      /* 水平居中 */
  width: 48px; height: 48px;    /* 固定尺寸 */
  border-radius: 12px;          /* 圆角 */
  color: var(--text-secondary); /* 默认灰色 */
  transition: all 0.2s;         /* 过渡动画 */
}

/* 悬停时图标变品牌色 */
.group-item:hover .group-icon { color: var(--active-color); }

/* 名称文本：小字号，超出用省略号 */
.group-name {
  font-size: 12px;              /* 小字号 */
  color: var(--text-secondary); /* 灰色 */
  text-align: center;           /* 居中 */
  line-height: 1.3;             /* 行高 */
  max-width: 64px;              /* 最大宽度，防止过长 */
  overflow: hidden;             /* 超出隐藏 */
  text-overflow: ellipsis;      /* 超出显示省略号 */
  white-space: nowrap;          /* 不换行 */
  transition: color 0.2s;       /* 颜色过渡 */
}

/* 拖拽时的幽灵占位元素 */
.ghost {
  opacity: 0.4;                   /* 半透明 */
  background: var(--hover-bg) !important; /* 浅色背景 */
  border-radius: 10px;            /* 圆角 */
}

/* 空状态：居中显示 */
.empty-state {
  flex: 1;                      /* 占满剩余高度 */
  display: flex;                /* 弹性布局 */
  align-items: center;          /* 垂直居中 */
  justify-content: center;      /* 水平居中 */
}

/* 底部区域：水平排列按钮，居中对齐 */
.sidebar-footer {
  padding: 12px;                /* 内边距 */
  display: flex;                /* 弹性布局 */
  justify-content: center;      /* 水平居中 */
  align-items: center;          /* 垂直居中 */
  gap: 12px;                    /* 按钮间距 */
}

/* 底部通用按钮样式 */
.footer-btn {
  color: var(--text-secondary) !important;
  --el-button-bg-color: transparent !important;
  --el-button-border-color: var(--border-color) !important;
  --el-button-hover-bg-color: var(--hover-bg) !important;
  --el-button-hover-border-color: var(--active-color) !important;
  --el-button-hover-text-color: var(--active-color) !important;
}

/* 右键菜单浮层：fixed 定位，浮在页面之上 */
.context-menu {
  position: fixed;              /* 固定定位，不随页面滚动 */
  z-index: 1000;                /* 高层级，覆盖在其他内容之上 */
  background: var(--panel-bg);  /* 白色背景 */
  border-radius: 8px;           /* 圆角 */
  box-shadow: 0 4px 16px var(--shadow-color); /* 阴影立体感 */
  padding: 4px;                 /* 内边距 */
  min-width: 120px;             /* 最小宽度 */
}

/* 右键菜单项：横向排列图标和文字 */
.context-menu-item {
  display: flex;                /* 弹性布局 */
  align-items: center;          /* 垂直居中 */
  gap: 8px;                     /* 图标文字间距 */
  padding: 8px 12px;            /* 内边距 */
  border-radius: 6px;           /* 圆角 */
  cursor: pointer;              /* 手型指针 */
  font-size: 13px;              /* 字号 */
  color: var(--text-primary);   /* 文字颜色 */
  transition: background 0.15s; /* 背景过渡 */
}

/* 右键菜单项悬停效果 */
.context-menu-item:hover { background-color: var(--context-menu-hover); }

/* 危险操作（删除）的红色样式 */
.context-menu-item.danger {
  color: var(--danger-color);   /* 红色文字 */
}

/* 危险操作悬停效果 */
.context-menu-item.danger:hover { background-color: var(--danger-hover-bg); /* 浅红色背景 */ }
</style>
