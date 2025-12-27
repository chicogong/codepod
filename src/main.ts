import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useAppStore } from './stores'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize app store
const appStore = useAppStore()
appStore.loadPersistedState()

app.mount('#app')
