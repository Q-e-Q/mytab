<template>
  <!--
    内容区域：当前为静态提示信息，
    后续会根据选中的标签动态展示对应内容。
  -->
  <div class="content-placeholder">
    <el-empty description="选择或新建一个标签页" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
// 无需额外逻辑，纯占位组件
</script>

<style scoped>
.content-placeholder {
  text-align: center;
  color: #909399;
}
</style>