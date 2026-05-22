import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path' // 引入 path 模块，用于路径解析

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 🔧 部署相关：使用相对路径，兼容部署到子目录
  base: './',

  resolve: {
    alias: {
      // 🔧 路径别名，方便引用 src 目录
      '@': resolve(__dirname, 'src')
    }
  }
})