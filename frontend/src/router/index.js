import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('../views/Test.vue')
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('../views/Compare.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  // 新增页面
  {
    path: '/video',
    name: 'Video',
    component: () => import('../views/Video.vue')
  },
  {
    path: '/training',
    name: 'Training',
    component: () => import('../views/Training.vue')
  },
  {
    path: '/assistant',
    name: 'Assistant',
    component: () => import('../views/Assistant.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router