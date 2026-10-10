<script setup>
// src/components/common/Sidebar.vue
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { logout, getCurrentUser } from '../../services/authService.js'
import {
  Hotel, LayoutDashboard, Users, MessageCircle, CheckSquare, Settings, LogOut, ShieldCheck
} from '@lucide/vue'

const props = defineProps({
  type: {
    type: String,
    required: false,
    default: 'manager' // 'manager' | 'admin'
  }
})

const router = useRouter()
const currentUser = computed(() => getCurrentUser())

const effectiveType = computed(() => {
  if (currentUser.value?.role === 'admin') return 'admin'
  return props.type || 'manager'
})

const title = computed(() => effectiveType.value === 'admin' ? 'Adoga Admin' : 'Adoga Manager')
const subtitle = computed(() => effectiveType.value === 'admin' ? 'System Console' : 'Partner Portal')

const links = computed(() => {
  if (effectiveType.value === 'admin') {
    return [
      { to: '/admin', label: 'แดชบอร์ดภาพรวม', icon: LayoutDashboard },
      { to: '/admin/approval', label: 'อนุมัติโรงแรม', icon: CheckSquare },
      { to: '/admin/messages', label: 'ข้อความระบบ & แชท', icon: MessageCircle },
      { to: '/admin/settings', label: 'ตั้งค่าระบบ', icon: Settings },
    ]
  }
  return [
    { to: '/manager', label: 'ภาพรวม & แดชบอร์ด', icon: LayoutDashboard },
    { to: '/manager/guests', label: 'จัดการลูกค้า', icon: Users },
    { to: '/manager/messages', label: 'ข้อความ & แชท', icon: MessageCircle },
  ]
})

function doLogout() {
  logout()
  router.push('/auth')
}
</script>

<template>
  <div>
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-line py-6 px-4 fixed top-0 left-0 h-screen justify-between z-30 shadow-xs">
      <!-- Top Section: Logo & Nav Links -->
      <div class="flex flex-col gap-6">
        <!-- Logo -->
        <div class="flex flex-col gap-1 px-1">
          <img src="/docs/ui-specs/adoga_logo.png" alt="Adoga" class="h-20 w-auto object-contain self-start" />
          <span :class="['text-[11px] font-extrabold uppercase tracking-wider px-1 py-0.5 rounded-md self-start border', effectiveType === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200']">
            {{ effectiveType === 'admin' ? 'System Console' : 'Partner Portal' }}
          </span>
        </div>

        <!-- Nav Links -->
        <nav class="flex flex-col gap-1.5">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 h-11 px-3.5 rounded-xl text-sm font-medium transition-all no-underline text-ink-muted hover:bg-slate-100 hover:text-ink"
            active-class="!text-indigo-700 !bg-indigo-50 font-semibold shadow-xs"
          >
            <component :is="link.icon" class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- Bottom Section: User Info & Logout Button -->
      <div class="pt-4 border-t border-line flex flex-col gap-3">
        <!-- Current User Info Card -->
        <div class="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
            {{ (currentUser?.nickname || currentUser?.firstName || 'U')[0].toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-ink truncate">{{ currentUser?.nickname || currentUser?.firstName }}</p>
            <p class="text-[11px] text-ink-muted capitalize truncate">{{ currentUser?.role }}</p>
          </div>
        </div>

        <!-- Logout Button at Bottom of Sidebar -->
        <button
          @click="doLogout"
          type="button"
          class="w-full flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-sm font-medium text-rose-600 bg-rose-50/80 hover:bg-rose-600 hover:text-white transition-all border border-rose-200 shadow-xs cursor-pointer"
        >
          <LogOut class="w-4 h-4" :stroke-width="2" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Top Navigation Bar (< lg) -->
    <header class="lg:hidden sticky top-0 z-40 bg-white border-b border-line px-4 py-3 flex items-center justify-between shadow-xs">
      <div class="flex items-center gap-2">
        <img src="/docs/ui-specs/adoga_logo.png" alt="Adoga" class="h-7 w-auto object-contain" />
        <span :class="['text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border', effectiveType === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200']">
          {{ effectiveType === 'admin' ? 'Admin' : 'Manager' }}
        </span>
      </div>

      <!-- Mobile Navigation Links & Logout -->
      <div class="flex items-center gap-1.5 overflow-x-auto">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="px-2.5 py-1 rounded-lg text-xs font-medium text-ink-muted hover:bg-slate-100 no-underline whitespace-nowrap"
          active-class="!text-indigo-700 !bg-indigo-50 font-semibold"
        >
          {{ link.label }}
        </RouterLink>
        <button
          @click="doLogout"
          type="button"
          class="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap ml-1 cursor-pointer"
        >
          <LogOut class="w-3.5 h-3.5" :stroke-width="2" />
          <span>ออก</span>
        </button>
      </div>
    </header>
  </div>
</template>
