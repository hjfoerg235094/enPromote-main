// 全局css样式 比如将浏览器的默认样式重置
import './assets/css/global.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router'

const app = createApp(App)
app.use(router)
app.mount('#app')
