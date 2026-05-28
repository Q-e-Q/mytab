<!--
  添加/编辑链接弹窗：
  - 居中弹出
  - 表单：名称、URL、图标
  - 传入 link 时为编辑模式，否则为新建模式
-->
<template>
  <div class="add-link-mask" @click.self="$emit('close')">
    <div class="add-link-panel">
      <h3 class="panel-title">{{ link ? '编辑链接' : '添加链接' }}</h3>

      <div class="form-group">
        <label class="form-label">名称</label>
        <el-input v-model="linkName" placeholder="链接名称" maxlength="20" clearable />
      </div>

      <div class="form-group">
        <label class="form-label">网址</label>
        <el-input v-model="linkUrl" placeholder="https://" clearable @keyup.enter="handleSave" />
      </div>

      <div class="form-group">
        <label class="form-label">图标链接（可选）</label>
        <el-input v-model="linkIcon" placeholder="https://example.com/favicon.ico" clearable />
      </div>

      <div class="panel-footer">
        <el-button size="small" @click="$emit('close')">取消</el-button>
        <el-button size="small" type="primary" @click="handleSave" :disabled="!canSave">
          {{ link ? '更新' : '保存' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Link } from '@/types/tab'

const props = defineProps<{
  link?: Link  // 传入 link 时为编辑模式，预填表单
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; url: string; icon: string; id?: string }]
}>()

const linkName = ref(props.link?.name || '')
const linkUrl = ref(props.link?.url || '')
const linkIcon = ref(props.link?.icon || '')

const canSave = computed(() => linkName.value.trim().length > 0 && linkUrl.value.trim().length > 0)

function handleSave() {
  if (!canSave.value) return
  emit('save', {
    name: linkName.value.trim(),
    url: linkUrl.value.trim(),
    icon: linkIcon.value.trim(),
    id: props.link?.id,  // 编辑模式传 id 用来更新
  })
}
</script>

<style scoped>
.add-link-mask {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: var(--mask-bg);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-link-panel {
  width: 400px;
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

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
