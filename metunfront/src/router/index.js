import { createRouter, createWebHistory } from 'vue-router'
import { showVerifiedPopup } from '../store/popupStore.js'

import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import CreateProfileView from '../views/CreateProfileView.vue'
import GroupsView from '../views/GroupsView.vue'
import MatchesView from '../views/MatchesView.vue'
import SettingsView from '../views/SettingsView.vue'
import VerificationView from '../views/VerificationView.vue'
import AdminDashboard from '../views/Admin/AdminDashboard.vue'
import MoreView from '../views/MoreView.vue'

import UsersView from '../views/Admin/UsersView.vue'
import UniversitiesView from '../views/Admin/UniversitiesView.vue'
import RequestsView from '../views/Admin/RequestsView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/more', name: 'more', component: MoreView, meta: { requiresAuth: false } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/create-profile', name: 'create-profile', component: CreateProfileView, meta: { requiresAuth: true } },
  { path: '/groups', name: 'groups', component: GroupsView, meta: { requiresAuth: true, requiresVerified: true } },
  { path: '/matches', name: 'matches', component: MatchesView, meta: { requiresAuth: true, requiresVerified: true } },
  { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
  { path: '/verification', name: 'verification', component: VerificationView, meta: { requiresAuth: true } },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'users', name: 'AdminUsers', component: UsersView },
      { path: 'universities', name: 'AdminUniversities', component: UniversitiesView },
      { path: 'requests', name: 'AdminRequests', component: RequestsView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  console.log(`[ROUTER] Checking route: ${to.fullPath}`)
  
  if (to.meta.requiresAuth) {
    try {
      let res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" })

      if (res.status === 401) {
        console.log("[ROUTER] Access token expired, trying refresh")
        const refresh = await fetch("http://localhost:3000/api/auth/refresh-token", { credentials: "include" })
        if (!refresh.ok) {
          console.log("[ROUTER] Refresh token failed")
          return next("/")
        }
        res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" })
      }

      if (!res.ok) {
        console.log("[ROUTER] /me failed", res.status)
        return next("/")
      }

      const user = await res.json()
      console.log("[ROUTER] User fetched:", user)

      if (to.meta.requiresAdmin && user.role !== "admin") {
        console.log("[ROUTER] User is not admin")
        return next("/dashboard")
      }

      if (to.meta.requiresVerified && !user.isVerified) {
        console.log("[ROUTER] User is NOT verified, blocking route")
        showVerifiedPopup.value = true
        return next("/dashboard")
      }

      console.log("[ROUTER] User verified or route does not require verification")
      next()
    } catch (err) {
      console.error("[ROUTER] Auth check failed:", err)
      next("/")
    }
  } else {
    next()
  }
})

export default router
