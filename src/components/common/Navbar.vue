<script setup>
// src/components/common/Navbar.vue
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useSession } from '../../stores/session.js'
import { logout } from '../../services/authService.js'
import { db } from '../../stores/db.js'
import {
  Home, User, MessageCircle, LayoutDashboard,
  LogOut, Menu, X, Hotel
} from '@lucide/vue'

const router = useRouter()
const { session, isGuest, isManager, isAdmin } = useSession()
const menuOpen = ref(false)

const currentUser = computed(() => {
  if (!session.value) return null
  const users = db['adoga_users'] || []
  return users.find(u => u.id === session.value.userId)
})

function doLogout() {
  logout()
  router.push('/auth')
  menuOpen.value = false
}

const navLinks = computed(() => {
  if (isManager.value) return [
    { to: '/home', label: 'หน้าแรก', icon: Home },
    { to: '/manager', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { to: '/manager/messages', label: 'ข้อความ', icon: MessageCircle },
  ]
  if (isAdmin.value) return [
    { to: '/home', label: 'หน้าแรก', icon: Home },
    { to: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { to: '/profile', label: 'โปรไฟล์', icon: User },
  ]
  return [
    { to: '/home', label: 'หน้าแรก', icon: Home },
    { to: '/messages', label: 'ข้อความ', icon: MessageCircle },
    { to: '/profile', label: 'โปรไฟล์', icon: User },
  ]
})
</script>

<template>
  <nav class="sticky top-0 z-40 h-20 bg-white/95 backdrop-blur-md border-b border-line shadow-xs supports-[not(backdrop-filter)]:bg-white/98">
    <div class="w-full px-4 sm:px-6 md:px-8 lg:px-10 h-full flex items-center justify-between">
      
      <!-- Left side: Logo + Navigation Links -->
      <div class="flex items-center gap-6 lg:gap-10">
        <!-- Logo -->
        <RouterLink to="/home" class="flex items-center gap-2.5 font-display font-bold text-2xl md:text-3xl text-indigo-600 no-underline hover:opacity-90 transition-opacity">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Hotel class="w-6 h-6 text-white" :stroke-width="2.2" />
          </div>
          <span class="tracking-tight text-slate-900">Adoga</span>
        </RouterLink>

        <!-- Desktop Navigation Links (Left Aligned Next to Logo) -->
        <div class="hidden md:flex items-center gap-2">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2 px-5 h-11 rounded-full text-base font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all no-underline"
            active-class="text-indigo-600 bg-indigo-50/80 hover:bg-indigo-50 font-bold shadow-2xs"
          >
            <component :is="link.icon" class="w-5 h-5 text-indigo-600" :stroke-width="2" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- Right side: User Greeting & Logout -->
      <div class="flex items-center gap-4">
        <!-- Guest State -->
        <template v-if="isGuest">
          <RouterLink to="/auth" class="hidden sm:block">
            <button class="h-11 px-5 rounded-full text-base font-semibold text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer">
              เข้าสู่ระบบ
            </button>
          </RouterLink>
          <RouterLink to="/auth">
            <button class="h-11 px-6 rounded-full text-base font-semibold bg-coral-600 hover:bg-coral-700 text-white shadow-md transition-colors cursor-pointer">
              สมัครสมาชิก
            </button>
          </RouterLink>
        </template>

        <!-- Logged in State -->
        <template v-else>
          <span class="hidden sm:block text-base font-semibold text-slate-700">
            สวัสดี, <strong class="text-indigo-600 font-bold">{{ currentUser?.nickname || currentUser?.firstName || 'ผู้ใช้งาน' }}</strong>
          </span>

          <button
            @click="doLogout"
            class="hidden sm:flex items-center gap-2 h-11 px-4 rounded-full text-base font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
          >
            <LogOut class="w-5 h-5 text-rose-500" :stroke-width="2" />
            <span>ออกจากระบบ</span>
          </button>
        </template>

        <!-- Mobile menu button -->
        <button
          @click="menuOpen = !menuOpen"
          class="md:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer"
          :aria-label="menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'"
        >
          <X v-if="menuOpen" class="w-6 h-6" :stroke-width="2" />
          <Menu v-else class="w-6 h-6" :stroke-width="2" />
        </button>
      </div>

    </div>

    <!-- Mobile menu drawer -->
    <Transition name="drawer">
      <div v-if="menuOpen" class="md:hidden absolute top-20 inset-x-0 bg-white border-b border-line shadow-xl px-4 py-4 flex flex-col gap-2 z-50">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          @click="menuOpen = false"
          class="flex items-center gap-3 px-5 h-12 rounded-2xl text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors no-underline"
          active-class="text-indigo-600 bg-indigo-50 font-bold"
        >
          <component :is="link.icon" class="w-5 h-5 text-indigo-600" :stroke-width="2" />
          <span>{{ link.label }}</span>
        </RouterLink>

        <div v-if="isGuest" class="pt-3 border-t border-line flex flex-col gap-2 mt-1">
          <RouterLink to="/auth" @click="menuOpen = false" class="h-12 rounded-2xl text-base font-semibold bg-coral-600 text-white flex items-center justify-center shadow-md">
            สมัครสมาชิก / เข้าสู่ระบบ
          </RouterLink>
        </div>

        <div v-else class="pt-3 border-t border-line flex flex-col gap-3 mt-1">
          <div class="px-3 text-base font-semibold text-slate-700">
            สวัสดี, <strong class="text-indigo-600 font-bold">{{ currentUser?.nickname || currentUser?.firstName || 'ผู้ใช้งาน' }}</strong>
          </div>
          <button @click="doLogout" class="flex items-center gap-3 px-4 h-12 rounded-2xl text-base font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 cursor-pointer">
            <LogOut class="w-5 h-5 text-rose-500" :stroke-width="2" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 200ms cubic-bezier(.2,.8,.2,1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
