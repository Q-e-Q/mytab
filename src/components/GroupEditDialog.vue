<!--
  分组编辑弹窗：
  - 紧贴侧边栏边缘弹出
  - 侧边栏在左 → 靠右侧弹出；侧边栏在右 → 靠左侧弹出
  - 提供 32 个 Element Plus 图标供选择
  - 名称输入框（最多 20 字）
  - 新建/编辑模式复用
-->
<template>
  <!-- 半透明遮罩层：覆盖全屏，点击遮罩本身（非弹窗区域）关闭 -->
  <div class="group-edit-mask" @click.self="$emit('close')">
    <!--
      编辑面板容器
      :style 根据侧边栏位置动态设置 left 或 right
    -->
    <div
      class="group-edit-panel"
      :style="panelStyle"
    >
      <!-- 面板标题：根据 isEdit 显示"编辑分组"或"新建分组" -->
      <h3 class="panel-title">{{ isEdit ? '编辑分组' : '新建分组' }}</h3>

      <!-- 图标选择区 -->
      <div class="icon-section">
        <!-- 区块标签 -->
        <label class="section-label">选择图标</label>
        <!-- 图标网格容器，紧凑排列 -->
        <div class="icon-grid">
          <!-- 遍历 iconList（字符串数组），每个图标渲染为一个可点击的选项 -->
          <div
            v-for="iconName in iconList"
            :key="iconName"
            class="icon-item"
            :class="{ active: selectedIcon === iconName }"
            @click="selectedIcon = iconName"
          >
            <el-icon :size="20">
              <!-- 根据图标名字符串动态渲染图标组件 -->
              <component :is="getIconComponent(iconName)" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 名称输入区 -->
      <div class="name-section">
        <!-- 区块标签 -->
        <label class="section-label">分组名称</label>
        <!--
          el-input：Element Plus 输入框
          v-model 双向绑定 groupName
          maxlength 限制 20 字，show-word-limit 显示字数统计
          clearable 显示清除按钮
          @keyup.enter 按回车触发保存
        -->
        <el-input
          v-model="groupName"
          placeholder="请输入分组名称"
          maxlength="20"
          show-word-limit
          clearable
          @keyup.enter="handleSave"
        />
      </div>

      <!-- 底部按钮区 -->
      <div class="panel-footer">
        <!-- 取消按钮：点击关闭弹窗 -->
        <el-button size="small" @click="$emit('close')">取消</el-button>
        <!--
          保存按钮：点击触发 handleSave
          :disabled="!canSave" 当名称为空时禁用
        -->
        <el-button size="small" type="primary" @click="handleSave" :disabled="!canSave">
          保存
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 分组编辑弹窗：
 * - 支持新建/编辑两种模式
 * - 动态计算弹窗位置（适配左侧栏和右侧栏）
 * - 无需额外导入 Store，通过 props 传入数据
 */
import { ref, computed } from 'vue'
import * as Icons from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'

// 获取 Store 实例，用于读取侧边栏位置和宽度
const store = useTabsStore()

// ---- Props 定义 ----
const props = defineProps<{
  group?: { id: string; name: string; icon: string }  // 编辑模式传入分组数据，新建模式为 undefined
}>()

// ---- Emits 定义 ----
const emit = defineEmits<{
  close: []                                             // 关闭弹窗事件
  save: [data: { name: string; icon: string }]          // 保存事件，传出名称和图标
}>()

// ---- 图标数据 ----
const iconNames = [
  'Folder', 'FolderOpened', 'Collection', 'Document', 'Notebook', 'Reading',
  'Star', 'StarFilled', 'Heart', 'Bell', 'Home', 'Shop',
  'ShoppingCart', 'Phone', 'Message', 'ChatDotSquare', 'User', 'Avatar',
  'Camera', 'Picture', 'Music', 'VideoCamera', 'Headset', 'Trophy',
  'Medal', 'Fire', 'Sunny', 'Moon', 'Cloudy', 'Umbrella',
  'Coffee', 'Food'
]

const iconList = iconNames.filter(name => (Icons as any)[name])

function getIconComponent(iconName: string) {
  return (Icons as any)[iconName] || Icons.Folder
}

// ---- 响应式状态 ----
const isEdit = computed(() => !!props.group)
const groupName = ref(props.group?.name || '')
const selectedIcon = ref(props.group?.icon || 'Folder')
const canSave = computed(() => groupName.value.trim().length > 0)

/** 动态弹窗位置样式 */
const panelStyle = computed(() => {
  const width = store.sidebarWidth
  if (store.sidebarPosition === 'left') {
    // 侧边栏在左 → 弹窗靠在侧边栏右侧
    return { left: width + 'px' }
  } else {
    // 侧边栏在右 → 弹窗靠在侧边栏左侧（用 right 定位）
    return { right: width + 'px' }
  }
})

// ---- 方法 ----
function handleSave() {
  if (!canSave.value) return
  emit('save', {
    name: groupName.value.trim(),
    icon: selectedIcon.value
  })
}
</script>

<style scoped>
/* 全屏遮罩层：fixed 定位覆盖整个视口，半透明灰色背景 */
.group-edit-mask {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: var(--mask-bg);
  z-index: 2000;
}

/* 编辑面板：紧贴侧边栏边缘，垂直居中，高度自适应 */
.group-edit-panel {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 22vw;
  max-height: 70vh;
  background: var(--panel-bg);
  box-shadow: 4px 0 20px var(--shadow-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 2.5vh 2vw;
  border-radius: 10px;
  animation: slideIn 0.2s ease;
  z-index: 2001;
}

/* 从左滑入的关键帧动画 */
@keyframes slideIn {
  from { transform: translateX(-20px) translateY(-50%); opacity: 0; }
  to { transform: translateX(0) translateY(-50%); opacity: 1; }
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.2vh 0;
  flex-shrink: 0;
}

.icon-section {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: 0.8vh;
}

.section-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 6px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  color: var(--text-secondary);
}

.icon-item:hover {
  background-color: var(--hover-bg);
  border-color: #d9ecff;
  color: var(--active-color);
}

.icon-item.active {
  background-color: var(--active-bg);
  border-color: var(--active-color);
  color: var(--active-color);
}

.name-section {
  margin-top: 1.2vh;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 0.8vh;
  border-top: 1px solid var(--border-light);
  margin-top: auto;
}
</style>
