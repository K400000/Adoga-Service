<script setup>
// src/views/AdminSettings.vue
import { runSeed } from '../data/seed.js'
import { RefreshCw } from '@lucide/vue'
import Sidebar from '../components/common/Sidebar.vue'

function resetData() {
  if (confirm('รีเซ็ตข้อมูลทั้งหมด? ข้อมูลที่ไม่ใช่ seed จะหายไป')) {
    runSeed(true)
    window.location.reload()
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <Sidebar type="admin" />
    <div class="flex-1 min-w-0 lg:ml-64 px-4 md:px-8 py-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-8">ตั้งค่าระบบ</h1>

      <div class="flex flex-col gap-4 max-w-xl">
        <!-- Reset data -->
        <div class="bg-white rounded-2xl border border-rose-200 p-6">
          <h3 class="font-semibold text-ink mb-1">รีเซ็ต Demo Data</h3>
          <p class="text-sm text-ink-muted mb-4">คืนข้อมูลทั้งหมดเป็น seed เริ่มต้น (ใช้ตอนเดโมหรือทดสอบ)</p>
          <button @click="resetData" class="flex items-center gap-2 h-10 px-5 rounded-full bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors cursor-pointer">
            <RefreshCw class="w-4 h-4" :stroke-width="1.75" />
            รีเซ็ตข้อมูล
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
