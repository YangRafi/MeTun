// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MoreView from '../views/MoreView.vue'
import DashboardView from '../views/DashboardView.vue'
import CreateProfileView from '../views/CreateProfileView.vue'
import GroupsView from '../views/GroupsView.vue'
import MatchesView from '../views/MatchesView.vue'
import SettingsView from '../views/SettingsView.vue'
import VerificationView from '../views/VerificationView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/more', name: 'more', component: MoreView, meta: { requiresAuth: false } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/create-profile', name: 'create-profile', component: CreateProfileView, meta: { requiresAuth: true } },
  { path: '/groups', name: 'groups', component: GroupsView, meta: { requiresAuth: true } },
  { path: '/matches', name: 'matches', component: MatchesView, meta: { requiresAuth: true } },
  { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
  { path: '/verification', name: 'verification', component: VerificationView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const res = await fetch("http://localhost:3000/api/auth/check", { credentials: "include" })
      if (res.ok) next()
      else next("/")
    } catch {
      next("/")
    }
  } else {
    next()
  }
})

export default router
