// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { get } from '../utils/storage.js'
import { sweepExpired } from '../services/transitions.js'

// Lazy-load views
const Home = () => import('../views/Home.vue')
const Auth = () => import('../views/Auth.vue')
const ForgotPassword = () => import('../views/ForgotPassword.vue')
const HotelDetail = () => import('../views/HotelDetail.vue')
const BookingFlow = () => import('../views/BookingFlow.vue')
const UserProfile = () => import('../views/UserProfile.vue')
const UserMessage = () => import('../views/UserMessage.vue')
const ManagerDashboard = () => import('../views/ManagerDashboard.vue')
const ManagerMessage = () => import('../views/ManagerMessage.vue')
const ManagerGuestList = () => import('../views/ManagerGuestList.vue')
const AdminDashboard = () => import('../views/AdminDashboard.vue')
const AdminApproval = () => import('../views/AdminApproval.vue')
const AdminSettings = () => import('../views/AdminSettings.vue')

const routes = [
  { path: '/', component: Home, meta: { access: 'all' } },
  { path: '/hotel/:id', component: HotelDetail, meta: { access: 'all' } },
  { path: '/auth', component: Auth, meta: { access: 'guest' } },
  { path: '/auth/forgot', component: ForgotPassword, meta: { access: 'guest' } },
  { path: '/booking/:hotelId', component: BookingFlow, meta: { access: 'user' } },
  { path: '/profile', component: UserProfile, meta: { access: 'user' } },
  { path: '/messages', component: UserMessage, meta: { access: 'user' } },
  { path: '/manager', component: ManagerDashboard, meta: { access: 'manager' } },
  { path: '/manager/messages', component: ManagerMessage, meta: { access: 'manager' } },
  { path: '/manager/guests', component: ManagerGuestList, meta: { access: 'manager' } },
  { path: '/admin', component: AdminDashboard, meta: { access: 'admin' } },
  { path: '/admin/approval', component: AdminApproval, meta: { access: 'admin' } },
  { path: '/admin/settings', component: AdminSettings, meta: { access: 'admin' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach((to, from, next) => {
  sweepExpired()
  const session = get('adoga_current_session')
  const role = session?.role || null
  const access = to.meta.access

  if (access === 'all') return next()

  // If already logged in, redirect away from /auth
  if (access === 'guest') {
    if (role === 'user') return next('/')
    if (role === 'manager') return next('/manager')
    if (role === 'admin') return next('/admin')
    return next()
  }

  // Protected routes
  if (!session) {
    return next(`/auth?redirect=${encodeURIComponent(to.fullPath)}&reason=login_required`)
  }
  if (access !== role) {
    const home = role === 'manager' ? '/manager' : role === 'admin' ? '/admin' : '/'
    return next(home)
  }
  next()
})

router.afterEach(() => { sweepExpired() })

export default router
