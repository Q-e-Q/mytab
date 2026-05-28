<!--
  根组件：左右两栏布局
  侧边栏位置（左/右）由 store 动态决定
  侧边栏宽度和不透明度交由 Sidebar 组件内部控制
-->
<template>
  <div
    class="app-container"
    :style="{ flexDirection: store.sidebarPosition === 'left' ? 'row' : 'row-reverse' }"
  >
    <!-- 侧边栏区域：width 由 store 动态控制（opacity 交由内部 Sidebar 组件处理） -->
    <aside class="sidebar" :style="{ width: store.sidebarWidth + 'px' }">
      <Sidebar />
    </aside>

    <!-- 主要内容区域，占据剩余宽度 -->
    <main class="content">
      <ContentArea />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 根组件：
 * - 引入侧边栏和内容区组件
 * - 侧边栏的位置、宽度由 store 驱动
 * - 注意：opacity 放在 Sidebar 内部而非 aside 上，避免创建独立 stacking context 导致弹窗 z-index 失效
 */
import Sidebar from '@/components/Sidebar.vue'
import ContentArea from '@/components/ContentArea.vue'
import { useTabsStore } from '@/stores/tabs'

const store = useTabsStore()
</script>

<style scoped>
/* 容器撑满整个视口高度，flex 布局 */
.app-container {
  display: flex;
  height: 100%;
}

/* 侧边栏样式：背景色 + 边框分割线 */
.sidebar {
  background-color: var(--bg-secondary);
  border-inline-end: 1px solid var(--border-color);
  position: relative;
}

/* 内容区域：居中显示，溢出时滚动 */
.content {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background-color: var(--bg-content);
  overflow: hidden;
}
</style>
