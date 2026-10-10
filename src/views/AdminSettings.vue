<script setup>
// src/views/AdminSettings.vue
import { computed } from 'vue'
import { db } from '../stores/db.js'
import { runSeed } from '../data/seed.js'
import { RouterLink } from 'vue-router'
import { LayoutDashboard, CheckSquare, Settings, ToggleLeft, ToggleRight, RefreshCw } from '@lucide/vue'

const settings = computed(() => db['adoga_settings'] || { enableRefund: false })

function toggleRefund() {
  db['adoga_settings'] = { ...settings.value, enableRefund: !settings.value.enableRefund }
}

function resetData() {
  if (confirm('รีเซ็ตข้อมูลทั้งหมด? ข้อมูลที่ไม่ใช่ seed จะหายไป')) {
    runSeed(true)
    window.location.reload()
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex">
    <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-line py-6 px-4 sticky top-0 h-screen">
      <p class="text-xs font-medium text-ink-muted mb-4 px-2">ADMIN CONSOLE</p>
      <nav class="flex flex-col gap-1">
        <RouterLink to="/admin" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100"><LayoutDashboard class="w-5 h-5" :stroke-width="1.75" /> แดชบอร์ด</RouterLink>
        <RouterLink to="/admin/approval" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100"><CheckSquare class="w-5 h-5" :stroke-width="1.75" /> อนุมัติโรงแรม</RouterLink>
        <RouterLink to="/admin/settings" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50"><Settings class="w-5 h-5" :stroke-width="1.75" /> ตั้งค่า</RouterLink>
      </nav>
    </aside>
    <div class="flex-1 px-4 md:px-8 py-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-8">ตั้งค่าระบบ</h1>

      <div class="flex flex-col gap-4 max-w-xl">
        <!-- Refund toggle -->
        <div class="bg-white rounded-2xl border border-line p-6 flex items-center justify-between gap-4">
          <div>
            <h3 class="font-semibold text-ink">ระบบขอคืนเงิน (Beta)</h3>
            <p class="text-sm text-ink-muted mt-1">
              เมื่อปิด: ปุ่มขอคืนเงินจะแสดง "Coming Soon" · เมื่อเปิด: ผู้ใช้สามารถยื่นคำขอคืนเงินได้
            </p>
          </div>
          <button @click="toggleRefund" class="flex-shrink-0 transition-colors">
            <ToggleRight v-if="settings.enableRefund" class="w-10 h-10 text-emerald-600" :stroke-width="1.75" />
            <ToggleLeft v-else class="w-10 h-10 text-slate-400" :stroke-width="1.75" />
          </button>
        </div>

        <div :class="['px-4 py-3 rounded-xl text-sm font-medium', settings.enableRefund ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500']">
          ระบบขอคืนเงิน: {{ settings.enableRefund ? '✓ เปิดใช้งาน' : '✗ ปิดอยู่ (Coming Soon)' }}
        </div>

        <!-- Reset data -->
        <div class="bg-white rounded-2xl border border-rose-200 p-6">
          <h3 class="font-semibold text-ink mb-1">รีเซ็ต Demo Data</h3>
          <p class="text-sm text-ink-muted mb-4">คืนข้อมูลทั้งหมดเป็น seed เริ่มต้น (ใช้ตอนเดโมหรือทดสอบ)</p>
          <button @click="resetData" class="flex items-center gap-2 h-10 px-5 rounded-full bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
            <RefreshCw class="w-4 h-4" :stroke-width="1.75" />
            รีเซ็ตข้อมูล
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
