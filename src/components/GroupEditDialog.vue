<!--
  分组编辑弹窗：
  - 紧贴侧边栏右侧弹出，相对视口尺寸（20vw × 35vh）
  - 提供 32 个 Element Plus 图标供选择
  - 名称输入框（最多 20 字）
  - 新建/编辑模式复用
  - 垂直居中，不会超出视口
-->
<template>
  <!-- 半透明遮罩层：覆盖全屏，点击遮罩本身（非弹窗区域）关闭 -->
  <div class="group-edit-mask" @click.self="$emit('close')">
    <!-- 编辑面板容器：垂直居中 -->
    <div class="group-edit-panel">
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
// 导入 Vue 响应式 API
import { ref, computed } from 'vue'
// 导入所有 Element Plus 图标组件，用于动态渲染和判断图标是否存在
import * as Icons from '@element-plus/icons-vue'

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
/**
 * 预设的图标名称字符串列表
 * 从 Element Plus 图标库中选取了日常常用的 32 个图标
 */
const iconNames = [
  'Folder', 'FolderOpened', 'Collection', 'Document', 'Notebook', 'Reading',
  'Star', 'StarFilled', 'Heart', 'Bell', 'Home', 'Shop',
  'ShoppingCart', 'Phone', 'Message', 'ChatDotSquare', 'User', 'Avatar',
  'Camera', 'Picture', 'Music', 'VideoCamera', 'Headset', 'Trophy',
  'Medal', 'Fire', 'Sunny', 'Moon', 'Cloudy', 'Umbrella',
  'Coffee', 'Food'
]

/**
 * iconList：过滤出真实存在的图标名称（字符串数组）
 * 存字符串而非组件对象，因为字符串可以被 IndexedDB 序列化
 */
const iconList = iconNames.filter(name => (Icons as any)[name])

/**
 * 根据图标名称字符串获取对应的 Element Plus 图标组件
 * 如果找不到对应组件，用 Folder 图标兜底
 */
function getIconComponent(iconName: string) {
  return (Icons as any)[iconName] || Icons.Folder
}

// ---- 响应式状态 ----

/** 是否为编辑模式：有 props.group 则为编辑模式 */
const isEdit = computed(() => !!props.group)

/** 分组名称：编辑模式使用传入的名称，新建模式为空字符串 */
const groupName = ref(props.group?.name || '')

/** 选中的图标名称：编辑模式使用传入的图标，新建模式默认 Folder */
const selectedIcon = ref(props.group?.icon || 'Folder')

/** 是否可以保存：名称去掉首尾空格后长度 > 0 */
const canSave = computed(() => groupName.value.trim().length > 0)

// ---- 方法 ----

/** 保存：校验通过后 emit 'save' 事件，传出名称和图标（字符串） */
function handleSave() {
  if (!canSave.value) return                          // 名称为空时不保存
  emit('save', {
    name: groupName.value.trim(),                     // 去掉首尾空格的名称
    icon: selectedIcon.value                          // 图标名称字符串
  })
}
</script>

<style scoped>
/* 全屏遮罩层：fixed 定位覆盖整个视口，半透明灰色背景 */
.group-edit-mask {
  position: fixed;              /* 固定定位，不随页面滚动 */
  top: 0; left: 0;             /* 左上角对齐 */
  width: 100%; height: 100%;   /* 撑满整个视口 */
  background: var(--mask-bg);  /* 半透明遮罩 */
  z-index: 2000;                /* 高层级，覆盖其他内容 */
}

/* 编辑面板：紧贴侧边栏右侧，垂直居中，高度自适应 */
.group-edit-panel {
  position: fixed;              /* 固定定位 */
  left: 120px;                  /* 紧贴侧边栏（侧边栏宽度 120px） */
  top: 50%;                     /* 垂直居中 */
  transform: translateY(-50%);  /* 偏移自身一半高度实现完美居中 */
  width: 22vw;                  /* 相对宽度 */
  max-height: 70vh;             /* 最高不超过视口 70% 高度 */
  background: var(--panel-bg);  /* 面板背景色 */
  box-shadow: 4px 0 20px var(--shadow-color); /* 右侧阴影增加立体感 */
  display: flex;                /* 弹性布局 */
  flex-direction: column;       /* 纵向排列 */
  overflow: hidden;             /* 防止子项溢出面板边界 */
  padding: 2.5vh 2vw;          /* 内边距使用相对单位 */
  border-radius: 10px;          /* 圆角效果 */
  animation: slideIn 0.2s ease; /* 从左滑入动画 */
  z-index: 2001;                /* 比遮罩层高 1 级，显示在遮罩之上 */
}

/* 从左滑入的关键帧动画 */
@keyframes slideIn {
  from { transform: translateX(-20px) translateY(-50%); opacity: 0; } /* 起始：左侧 20px + 透明 */
  to { transform: translateX(0) translateY(-50%); opacity: 1; }       /* 结束：原位 + 不透明 */
}

/* 面板标题 */
.panel-title {
  font-size: 16px;              /* 字号 */
  font-weight: 600;             /* 半粗体 */
  color: var(--text-primary);   /* 深色文字 */
  margin: 0 0 1.2vh 0;         /* 底部留出间距 */
  flex-shrink: 0;               /* 防止被压缩（弹性布局中保持固定高度） */
}

/* 图标选择区：弹性压缩占满剩余高度，内容超出时内部滚动 */
.icon-section { 
  flex: 1;                      /* 占满标题和按钮之外的剩余空间 */
  min-height: 0;                /* 允许 flex 子项收缩到 0 */
  overflow-y: auto;             /* 内容超出时纵向滚动 */
  margin-top: 0.8vh;            /* 与标题紧凑间距 */
}

/* 区块标题 */
.section-label {
  display: block;               /* 块级显示，占一整行 */
  font-size: 13px;              /* 字号 */
  color: var(--text-secondary); /* 灰色文字 */
  font-weight: 500;             /* 中等粗细 */
  margin-bottom: 6px;           /* 与图标网格紧凑间距 */
}

/* 图标网格：6 列更紧凑，整体高度降低 */
.icon-grid {
  display: grid;                /* 网格布局 */
  grid-template-columns: repeat(6, 1fr); /* 6列，每列等宽 */
  gap: 2px;                     /* 紧凑网格间距 */
}

/* 单个图标选项 */
.icon-item {
  display: flex;                /* 弹性布局 */
  align-items: center;          /* 垂直居中 */
  justify-content: center;      /* 水平居中 */
  padding: 4px 0;              /* 较小内边距 */
  border-radius: 6px;           /* 圆角 */
  cursor: pointer;              /* 手型指针 */
  border: 1px solid transparent; /* 默认透明边框（选中时显示） */
  transition: all 0.15s;        /* 过渡动画 */
  color: var(--text-secondary); /* 默认灰色 */
}

/* 悬停效果：浅蓝背景 + 蓝色边框 + 蓝色图标 */
.icon-item:hover {
  background-color: var(--hover-bg);
  border-color: #d9ecff;
  color: var(--active-color);
}

/* 选中效果：蓝色边框 + 蓝色背景 + 蓝色图标 */
.icon-item.active {
  background-color: var(--active-bg);
  border-color: var(--active-color);
  color: var(--active-color);
}

/* 名称输入区 */
.name-section { 
  margin-top: 1.2vh;            /* 与图标区域拉开间距 */
}

/* 底部按钮区：靠右排列，固定在面板底部 */
.panel-footer {
  display: flex;                /* 弹性布局 */
  justify-content: flex-end;    /* 靠右排列 */
  gap: 8px;                     /* 按钮间距 */
  padding-top: 0.8vh;          /* 顶部内边距 */
  border-top: 1px solid var(--border-light); /* 分隔线 */
  margin-top: auto;             /* 自动上推，使此区域始终在面板底部 */
}
</style>
