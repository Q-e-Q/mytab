<template>
  <!--
    侧边栏：现阶段仅展示静态的“标签列表”标题和几个固定项，
    后续会改为从数据源动态渲染。
  -->
  <div class="sidebar-container">
    <!-- 标题区域 -->
    <div class="sidebar-header">
      <h3>标签页</h3>
      <el-button type="primary" size="small" :icon="Plus" circle />
    </div>

    <!-- 标签列表（静态占位） -->
    <ul class="tab-list">
      <li class="tab-item active">
        <el-icon><Document /></el-icon>
        <span>标签 1</span>
      </li>
      <li class="tab-item">
        <el-icon><Document /></el-icon>
        <span>标签 2</span>
      </li>
      <li class="tab-item">
        <el-icon><Document /></el-icon>
        <span>标签 3</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// Element Plus 图标，需要从 @element-plus/icons-vue 引入
import { Plus, Document } from '@element-plus/icons-vue'
// 注意：如果图标未安装，请执行: npm install @element-plus/icons-vue
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.tab-list {
  list-style: none;
  flex: 1;
  padding: 8px 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  transition: background 0.2s;
}

.tab-item:hover {
  background-color: #e9e9eb;
}

/* 模拟当前激活的标签项 */
.tab-item.active {
  background-color: #d9ecff;
  color: #409eff;
  font-weight: 500;
}
</style>