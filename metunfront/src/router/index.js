import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MoreView from '../views/MoreView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/more',
    name: 'More',
    component: MoreView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
