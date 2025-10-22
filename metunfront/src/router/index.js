import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MoreView from '../views/MoreView.vue'
import DashboardView from '../views/DashboardView.vue'
import CreateProfileView from '../views/CreateProfileView.vue'
import GroupsView from '../views/GroupsView.vue'
import MatchesView from '../views/MatchesView.vue'
import SettingsView from '../views/SettingsView.vue'
import VerificationView from '../views/VerificationView.vue'
import AdminDashboard from '../views/Admin/AdminDashboard.vue'

// Child views dla panelu admina
import UsersView from '../views/Admin/UsersView.vue'
import UniversitiesView from '../views/Admin/UniversitiesView.vue'
import RequestsView from '../views/Admin/RequestsView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/more', name: 'more', component: MoreView, meta: { requiresAuth: false } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/create-profile', name: 'create-profile', component: CreateProfileView, meta: { requiresAuth: true } },
  { path: '/groups', name: 'groups', component: GroupsView, meta: { requiresAuth: true } },
  { path: '/matches', name: 'matches', component: MatchesView, meta: { requiresAuth: true } },
  { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
  { path: '/verification', name: 'verification', component: VerificationView, meta: { requiresAuth: true } },

  // Panel admina z podstronami
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

// 🛡️ Globalny guard autoryzacji
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      let res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" });
      
      // jeśli access token wygasł
      if (res.status === 401) {
        const refresh = await fetch("http://localhost:3000/api/auth/refresh-token", { credentials: "include" });
        if (!refresh.ok) return next("/"); // brak refresh tokena, wyloguj

        // access token odświeżony, spróbuj ponownie /me
        res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" });
      }

      if (!res.ok) return next("/");

      const user = await res.json();

      if (to.meta.requiresAdmin && user.role !== "admin") {
        return next("/dashboard");
      }

      next();
    } catch (err) {
      console.error("Auth check failed:", err);
      next("/");
    }
  } else {
    next();
  }
});


export default router
