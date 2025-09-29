import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MoreView from '../views/MoreView.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import DashboardView from '../views/DashboardView.vue'

const routes = [
  // Publiczne
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/more', name: 'more', component: MoreView, meta: { requiresAuth: false } },
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
  { path: '/signup', name: 'signup', component: SignupView, meta: { requiresAuth: false } },

  // Prywatne
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Globalna ochrona tras
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const res = await fetch("http://localhost:3000/api/auth/check", {
        credentials: "include"
      })
      if (res.ok) {
        next()
      } else {
        next("/login")
      }
    } catch {
      next("/login")
    }
  } else {
    next()
  }
})

export default router