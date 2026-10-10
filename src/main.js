import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { runSeed } from './data/seed.js'

// Run seed on first load
runSeed()

createApp(App).use(router).mount('#app')
