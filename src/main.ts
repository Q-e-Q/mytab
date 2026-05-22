import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'       // Element Plus 全局样式
import App from './App.vue'
import './style.css'                        // 我们自己的全局基础样式

const app = createApp(App)

// 🔧 注册 Element Plus 组件库
app.use(ElementPlus)

app.mount('#app')