<template>
  <!--
    Element Plus 的布局容器：
    el-container：最外层容器
    el-aside：左侧侧边栏
    el-main：右侧主内容区
  -->
  <el-container class="app-container">
    <!-- 左侧标签列表区域 -->
    <el-aside width="220px" class="sidebar">
      <Sidebar />
    </el-aside>

    <!-- 右侧内容展示区域 -->
    <el-main class="content">
      <ContentArea />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
// 🔧 引入两个占位组件，下一阶段它们将承载真实逻辑
import Sidebar from '@/components/Sidebar.vue'
import ContentArea from '@/components/ContentArea.vue'
</script>

<style scoped>
/* 应用容器撑满整个视口 */
.app-container {
  height: 100%;
}

/* 侧边栏样式：浅灰背景，可自定义 */
.sidebar {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  /* 内部可滚动，以后标签多了可滚动 */
  overflow-y: auto;
}

/* 内容区保持居中提示的布局 */
.content {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}
</style>