/**
 * 应用入口：挂载 Vue 应用，注册 Pinia 和 Element Plus
 * 同时初始化深色模式（读取 localStorage）
 */
import { createApp } from 'vue'                 // Vue 3 应用创建函数
import { createPinia } from 'pinia'             // Pinia 状态管理库
import ElementPlus from 'element-plus'           // Element Plus UI 组件库
import 'element-plus/dist/index.css'             // Element Plus 的全局样式
import 'element-plus/theme-chalk/dark/css-vars.css' // Element Plus 深色模式样式
import App from './App.vue'                      // 根组件
import './style.css'                             // 自定义全局基础样式

// 启动时根据 localStorage 恢复深色模式
const saved = localStorage.getItem('isDark')
if (saved === 'true') {
  document.documentElement.classList.add('dark')
}

const app = createApp(App)                       // 创建 Vue 应用实例

app.use(createPinia())                           // 注册 Pinia 状态管理
app.use(ElementPlus)                             // 注册 Element Plus 组件库

app.mount('#app')                                // 将应用挂载到 index.html 的 #app 元素上
