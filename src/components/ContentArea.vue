<!--
  内容区域组件：
  - 有选中分组时：显示分组的大图标和名称
  - 无分组时：显示空状态提示
-->
<template>
  <!-- 内容区域容器 -->
  <div class="content-area">
    <!-- 有选中分组 → 展示分组信息 -->
    <div v-if="store.activeGroup" class="group-info">
      <!-- 分组头部：大图标 + 名称 + 提示 -->
      <div class="group-header">
        <!-- 大图标容器 -->
        <div class="group-icon-large">
          <el-icon :size="48">
            <!-- 根据图标名称动态渲染对应的图标组件 -->
            <component :is="getIconComponent(store.activeGroup.icon)" />
          </el-icon>
        </div>
        <!-- 分组名称 -->
        <h2 class="group-title">{{ store.activeGroup.name }}</h2>
        <!-- 操作提示 -->
        <p class="group-hint">在此分组中添加链接</p>
      </div>
    </div>

    <!-- 无分组 → 引导提示（显示 Element Plus 空状态组件） -->
    <div v-else class="content-placeholder">
      <el-empty description="点击底部 + 新建分组" :image-size="120" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入所有 Element Plus 图标，用于动态获取组件
import * as Icons from '@element-plus/icons-vue'
// 导入 Pinia Store
import { useTabsStore } from '@/stores/tabs'

// 获取 Store 实例
const store = useTabsStore()

/** 根据图标名称字符串获取对应的 Element Plus 图标组件，找不到则兜底使用 Folder */
function getIconComponent(iconName: string) {
  return (Icons as any)[iconName] || Icons.Folder
}
</script>

<style scoped>
/* 内容区域容器：撑满父元素，居中显示内容 */
.content-area {
  width: 100%;                  /* 宽度 100% */
  height: 100%;                 /* 高度 100% */
  display: flex;                /* 弹性布局 */
  align-items: center;          /* 垂直居中 */
  justify-content: center;      /* 水平居中 */
}

/* 分组信息区块：文字居中 */
.group-info { text-align: center; }

/* 分组头部：纵向排列，居中对齐 */
.group-header {
  display: flex;                /* 弹性布局 */
  flex-direction: column;       /* 纵向排列 */
  align-items: center;          /* 水平居中 */
  gap: 12px;                    /* 子元素间距 */
}

/* 大图标容器：圆形蓝色背景 */
.group-icon-large {
  width: 80px;                  /* 宽度 */
  height: 80px;                 /* 高度 */
  display: flex;                /* 弹性布局 */
  align-items: center;          /* 垂直居中 */
  justify-content: center;      /* 水平居中 */
  background: var(--active-bg); /* 浅蓝色背景 */
  border-radius: 20px;          /* 大圆角 */
  color: var(--active-color);   /* 蓝色图标 */
}

/* 分组标题样式 */
.group-title {
  font-size: 24px;              /* 大字号 */
  font-weight: 600;             /* 半粗体 */
  color: var(--text-primary);   /* 深色文字 */
  margin: 0;                    /* 清除默认外边距 */
}

/* 提示文字样式 */
.group-hint {
  font-size: 14px;              /* 小字号 */
  color: var(--text-hint);      /* 浅灰色 */
  margin: 0;                    /* 清除默认外边距 */
}

/* 空状态占位符样式 */
.content-placeholder { text-align: center; color: var(--text-hint); }
</style>
