import { createApp } from 'vue'
import { createPinia } from 'pinia';
import './style.css'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config';
import 'primeicons/primeicons.css';

createApp(App)
    .use(router)
    .use(createPinia())
    .use(PrimeVue, { unstyled: true })
    .mount('#app')
