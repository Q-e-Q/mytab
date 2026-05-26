<!-- 根组件：左右两栏布局，左侧为分组侧边栏，右侧为内容区 -->
<template>
  <!-- el-container：Element Plus 提供的容器组件，用于构建页面布局 -->
  <el-container class="app-container">
    <!-- el-aside：侧边栏区域，指定宽度 120px -->
    <el-aside width="120px" class="sidebar">
      <!-- 引入侧边栏组件，展示分组列表 -->
      <Sidebar />
    </el-aside>

    <!-- el-main：主要内容区域，占据剩余宽度 -->
    <el-main class="content">
      <!-- 引入内容区域组件，显示选中分组的详情 -->
      <ContentArea />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
// 引入侧边栏组件和内容区域组件
import Sidebar from '@/components/Sidebar.vue'
import ContentArea from '@/components/ContentArea.vue'
</script>

<style scoped>
/* 容器撑满整个视口高度 */
.app-container {
  height: 100%;
}

/* 侧边栏样式：浅灰背景 + 右边框分割线 */
.sidebar {
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  position: relative;           /* 为内部右键菜单等绝对定位元素提供参照 */
}

/* 内容区域：居中显示 */
.content {
  display: flex;                /* 弹性布局 */
  align-items: center;          /* 垂直居中 */
  justify-content: center;      /* 水平居中 */
  background-color: var(--bg-content);
}
</style>
