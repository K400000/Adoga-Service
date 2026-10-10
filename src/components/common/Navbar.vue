<script setup>
// src/components/common/Navbar.vue
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useSession } from '../../stores/session.js'
import { logout } from '../../services/authService.js'
import { getCurrentUser } from '../../services/authService.js'
import { db } from '../../stores/db.js'
import {
  Home, User, MessageCircle, LayoutDashboard, Settings,
  CheckSquare, LogOut, Menu, X, Hotel
} from '@lucide/vue'

const router = useRouter()
const { session, isGuest, isUser, isManager, isAdmin } = useSession()
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
  if (isUser.value) return [
    { to: '/home', label: 'หน้าแรก', icon: Home },
    { to: '/messages', label: 'ข้อความ', icon: MessageCircle },
    { to: '/profile', label: 'โปรไฟล์', icon: User },
  ]
  if (isManager.value) return [
    { to: '/manager', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { to: '/manager/guests', label: 'แขก', icon: User },
    { to: '/manager/messages', label: 'ข้อความ', icon: MessageCircle },
  ]
  if (isAdmin.value) return [
    { to: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { to: '/admin/approval', label: 'อนุมัติ', icon: CheckSquare },
    { to: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
  ]
  return [{ to: '/home', label: 'หน้าแรก', icon: Home }]
})
</script>

<template>
  <nav class="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-line shadow-xs supports-[not(backdrop-filter)]:bg-white/95">
    <div class="mx-auto max-w-[1280px] px-4 md:px-8 h-full flex items-center justify-between">
      <!-- Logo -->
      <RouterLink to="/home" class="flex items-center gap-2 font-display font-semibold text-xl text-ink no-underline">
        <div class="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Hotel class="w-5 h-5 text-white" :stroke-width="2" />
        </div>
        <span>Adoga</span>
      </RouterLink>

      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-medium text-ink-muted hover:text-ink hover:bg-slate-100 transition-colors no-underline"
          active-class="text-indigo-700 bg-indigo-50 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <component :is="link.icon" class="w-4 h-4" :stroke-width="1.75" />
          {{ link.label }}
        </RouterLink>
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-2">
        <!-- Guest -->
        <template v-if="isGuest">
          <RouterLink to="/auth" class="hidden sm:block">
            <button class="h-9 px-4 rounded-full text-sm font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors">
              เข้าสู่ระบบ
            </button>
          </RouterLink>
          <RouterLink to="/auth">
            <button class="h-9 px-4 rounded-full text-sm font-medium bg-coral-600 text-white hover:bg-coral-700 transition-colors">
              สมัครสมาชิก
            </button>
          </RouterLink>
        </template>
        <!-- Logged in -->
        <template v-else>
          <span class="hidden md:block text-sm text-ink-muted">สวัสดี, {{ currentUser?.nickname || currentUser?.firstName }}</span>
          <button
            @click="doLogout"
            class="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-full text-sm text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut class="w-4 h-4" :stroke-width="1.75" />
            ออกจากระบบ
          </button>
        </template>

        <!-- Mobile menu button -->
        <button
          @click="menuOpen = !menuOpen"
          class="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-ink transition-colors"
          :aria-label="menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'"
        >
          <X v-if="menuOpen" class="w-5 h-5" :stroke-width="1.75" />
          <Menu v-else class="w-5 h-5" :stroke-width="1.75" />
        </button>
      </div>
    </div>

    <!-- Mobile menu drawer -->
    <Transition name="drawer">
      <div v-if="menuOpen" class="md:hidden absolute top-16 inset-x-0 bg-white border-b border-line shadow-e2 px-4 py-3 flex flex-col gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          @click="menuOpen = false"
          class="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100 transition-colors no-underline"
          active-class="text-indigo-700 bg-indigo-50"
        >
          <component :is="link.icon" class="w-5 h-5" :stroke-width="1.75" />
          {{ link.label }}
        </RouterLink>
        <div v-if="isGuest" class="pt-2 border-t border-line flex flex-col gap-2 mt-1">
          <RouterLink to="/auth" @click="menuOpen = false" class="h-11 rounded-xl text-sm font-medium bg-coral-600 text-white flex items-center justify-center">สมัครสมาชิก / เข้าสู่ระบบ</RouterLink>
        </div>
        <button v-else @click="doLogout" class="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 mt-1 border-t border-line pt-2">
          <LogOut class="w-5 h-5" :stroke-width="1.75" />
          ออกจากระบบ
        </button>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 200ms cubic-bezier(.2,.8,.2,1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
