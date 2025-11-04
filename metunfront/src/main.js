import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

// 🎨 Motyw PrimeVue 4.3+
import Aura from '@primevue/themes/aura'

// 📦 Style
import 'primeicons/primeicons.css'
import './style.css'

const app = createApp(App)

app.use(router)
app.use(createPinia())

// ⚙️ Konfiguracja PrimeVue z motywem Aura
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.app-dark',
      cssLayer: false
    }
  }
})

app.use(ToastService)
app.use(ConfirmationService)

// 🔹 Rejestracja komponentów globalnie
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)

app.mount('#app')
