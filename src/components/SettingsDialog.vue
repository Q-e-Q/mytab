<!--
  设置弹窗（完整版）：
  - 居中弹出，尺寸 700×480
  - 左侧导航：通用 / 外观 / 侧边栏 / 关于
  - 通用：搜索引擎选择
  - 外观：浅色 / 深色 / 跟随系统
  - 侧边栏：位置、宽度、不透明度
  - 关于：版本信息
-->
<template>
  <div class="settings-mask" @click.self="$emit('close')">
    <div class="settings-panel">
      <!-- 左侧导航 -->
      <div class="settings-sidebar">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="settings-nav-item"
          :class="{ active: activeMenu === item.key }"
          @click="activeMenu = item.key"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="settings-content">
        <!-- ========== 通用 ========== -->
        <div v-if="activeMenu === 'general'">
          <h3 class="settings-section-title">通用</h3>
          <div class="settings-row">
            <span>默认搜索引擎</span>
            <el-select v-model="defaultEngine" size="small" style="width:160px" popper-class="settings-popper">
              <el-option
                v-for="eng in store.searchEngines"
                :key="eng.value"
                :label="eng.label"
                :value="eng.value"
              />
            </el-select>
          </div>
        </div>

        <!-- ========== 外观 ========== -->
        <div v-if="activeMenu === 'appearance'">
          <h3 class="settings-section-title">外观</h3>
          <div class="settings-row">
            <span>主题模式</span>
            <el-select
              :model-value="store.themeMode"
              @update:model-value="store.setThemeMode"
              size="small"
              style="width:140px"
              popper-class="settings-popper"
            >
              <el-option label="浅色" value="light" />
              <el-option label="深色" value="dark" />
              <el-option label="跟随系统" value="system" />
            </el-select>
          </div>
        </div>

        <!-- ========== 侧边栏 ========== -->
        <div v-if="activeMenu === 'sidebar'">
          <h3 class="settings-section-title">侧边栏</h3>

          <!-- 位置 -->
          <div class="settings-row">
            <span>位置</span>
            <el-radio-group
              :model-value="store.sidebarPosition"
              @update:model-value="(v: 'left' | 'right') => store.sidebarPosition = v"
              size="small"
            >
              <el-radio-button value="left">左侧</el-radio-button>
              <el-radio-button value="right">右侧</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 宽度：42~120px -->
          <div class="settings-row">
            <span>宽度</span>
            <div class="slider-group">
              <el-slider
                :model-value="store.sidebarWidth"
                @update:model-value="(v: number) => store.sidebarWidth = v"
                :min="42"
                :max="120"
                :step="1"
                show-input
                size="small"
                style="width:300px"
              />
              <span class="slider-unit">px</span>
            </div>
          </div>

          <!-- 背景不透明度：10~100% -->
          <div class="settings-row">
            <span>背景不透明度</span>
            <div class="slider-group">
              <el-slider
                :model-value="store.sidebarOpacity"
                @update:model-value="(v: number) => store.sidebarOpacity = v"
                :min="10"
                :max="100"
                :step="1"
                show-input
                size="small"
                style="width:300px"
              />
              <span class="slider-unit">%</span>
            </div>
          </div>
        </div>

        <!-- ========== 关于 ========== -->
        <div v-if="activeMenu === 'about'">
          <h3 class="settings-section-title">关于</h3>
          <p class="settings-about-text">MyTab v2.0 — 优雅的浏览器起始页</p>
          <p class="settings-about-text" style="margin-top:8px">支持农历、搜索引擎自定义、深色模式、链接拖拽排序</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设置弹窗组件：
 * - 四栏导航：通用、外观、侧边栏、关于
 * - 外观支持浅色/深色/跟随系统
 * - 侧边栏可调整位置、宽度（42-120px）、不透明度（0-100%）
 */
import { ref } from 'vue'
import { Setting, Monitor, Grid, InfoFilled } from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'

const store = useTabsStore()

defineEmits<{ close: [] }>()

const activeMenu = ref('general')

/** 默认搜索引擎（Local 状态，选中的引擎 value） */
const defaultEngine = ref(store.searchEngines[0]?.value || 'baidu')

const menuItems = [
  { key: 'general', label: '通用', icon: Setting },
  { key: 'appearance', label: '外观', icon: Monitor },
  { key: 'sidebar', label: '侧边栏', icon: Grid },
  { key: 'about', label: '关于', icon: InfoFilled },
]
</script>

<style scoped>
/* 全屏遮罩层 */
.settings-mask {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: var(--mask-bg);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主面板：700×480 */
.settings-panel {
  display: flex;
  width: 700px;
  height: 480px;
  background: var(--panel-bg);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--shadow-color);
  overflow: hidden;
}

/* 左侧导航 */
.settings-sidebar {
  width: 130px;
  background: var(--bg-secondary);
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--border-color);
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.settings-nav-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.settings-nav-item.active {
  background: var(--active-bg);
  color: var(--active-color);
  font-weight: 600;
}

/* 右侧内容 */
.settings-content {
  flex: 1;
  padding: 28px 32px;
  overflow-y: auto;
}

.settings-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px 0;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-unit {
  font-size: 13px;
  color: var(--text-hint);
  min-width: 24px;
}

.settings-about-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
