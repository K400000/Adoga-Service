<script setup>
// src/views/AdminDashboard.vue
import { computed, ref, onMounted } from 'vue'
import { db } from '../stores/db.js'
import { formatPrice } from '../utils/date.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import { RouterLink } from 'vue-router'
import { Users, Hotel, Calendar, DollarSign, LayoutDashboard, CheckSquare, Settings } from '@lucide/vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const users = computed(() => db['adoga_users'] || [])
const hotels = computed(() => db['adoga_hotels'] || [])
const bookings = computed(() => db['adoga_bookings'] || [])

const stats = computed(() => [
  { label: 'ผู้ใช้ทั้งหมด', value: users.value.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'โรงแรม Active', value: hotels.value.filter(h => h.status === 'approved').length, icon: Hotel, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'การจองทั้งหมด', value: bookings.value.length, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
  { label: 'รายได้รวม', value: formatPrice(bookings.value.filter(b => b.paymentStatus === 'success').reduce((s, b) => s + b.totalPrice, 0)), icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
])

const chartTab = ref('month')

const monthLabels = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

const chartData = computed(() => {
  const completed = bookings.value.filter(b => b.status === 'completed' && b.paymentStatus === 'success')
  if (chartTab.value === 'month') {
    const year = new Date().getFullYear()
    const monthly = Array(12).fill(0)
    completed.forEach(b => {
      const d = new Date(b.createdAt)
      if (d.getFullYear() === year) monthly[d.getMonth()] += b.totalPrice
    })
    return {
      labels: monthLabels,
      datasets: [{ label: 'รายได้ (฿)', data: monthly, backgroundColor: '#4F46E5', borderRadius: 8 }]
    }
  }
  if (chartTab.value === '24h') {
    const hours = Array(24).fill(0)
    const now = new Date()
    completed.forEach(b => {
      const diff = (now - new Date(b.createdAt)) / 3600000
      if (diff <= 24) hours[23 - Math.floor(diff)] += b.totalPrice
    })
    return {
      labels: Array(24).fill(0).map((_, i) => `${23-i}h`),
      datasets: [{ label: 'รายได้ (฿)', data: hours, backgroundColor: '#CF3F2A', borderRadius: 8 }]
    }
  }
  // year (last 5 years)
  const thisYear = new Date().getFullYear()
  const years = [thisYear-4, thisYear-3, thisYear-2, thisYear-1, thisYear]
  const yearly = years.map(y => completed.filter(b => new Date(b.createdAt).getFullYear() === y).reduce((s, b) => s + b.totalPrice, 0))
  return {
    labels: years.map(String),
    datasets: [{ label: 'รายได้ (฿)', data: yearly, backgroundColor: '#059669', borderRadius: 8 }]
  }
})

const chartOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => `฿${(v/1000).toFixed(0)}K` } } } }

const hotelsByStatus = computed(() => {
  const counts = {}
  for (const h of hotels.value) counts[h.status] = (counts[h.status] || 0) + 1
  return Object.entries(counts)
})
</script>

<template>
  <div class="min-h-screen bg-canvas flex">
    <!-- Sidebar -->
    <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-line py-6 px-4 sticky top-0 h-screen">
      <div class="flex items-center gap-2 mb-8 px-2">
        <div class="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center">
          <Settings class="w-5 h-5 text-white" :stroke-width="2" />
        </div>
        <div>
          <p class="font-display font-semibold text-sm text-ink">Admin Console</p>
          <p class="text-xs text-ink-muted">ระบบจัดการ</p>
        </div>
      </div>
      <nav class="flex flex-col gap-1">
        <RouterLink to="/admin" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50">
          <LayoutDashboard class="w-5 h-5" :stroke-width="1.75" /> แดชบอร์ด
        </RouterLink>
        <RouterLink to="/admin/approval" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100">
          <CheckSquare class="w-5 h-5" :stroke-width="1.75" /> อนุมัติโรงแรม
          <span class="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{{ hotels.filter(h => h.status === 'pending').length }}</span>
        </RouterLink>
        <RouterLink to="/admin/settings" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100">
          <Settings class="w-5 h-5" :stroke-width="1.75" /> ตั้งค่าระบบ
        </RouterLink>
      </nav>
    </aside>

    <!-- Content -->
    <div class="flex-1 px-4 md:px-8 py-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-8">ภาพรวมและสถิติระบบ</h1>

      <!-- Stats 4 col -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl border border-line p-4 md:p-6">
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.color]">
            <component :is="stat.icon" class="w-5 h-5" :stroke-width="1.75" />
          </div>
          <p class="text-2xl font-display font-semibold text-ink tabular-nums">{{ stat.value }}</p>
          <p class="text-sm text-ink-muted mt-1">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Chart 8 + Hotel status 4 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div class="lg:col-span-8 bg-white rounded-2xl border border-line p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-semibold text-lg text-ink">กราฟรายได้</h2>
            <div class="flex bg-slate-100 rounded-full p-1">
              <button v-for="t in [{ key:'24h', label:'24 ชม.' },{ key:'month', label:'รายเดือน' },{ key:'year', label:'รายปี' }]" :key="t.key"
                @click="chartTab = t.key"
                :class="['px-3 h-7 rounded-full text-xs font-medium transition-colors', chartTab === t.key ? 'bg-indigo-600 text-white' : 'text-ink-muted']">
                {{ t.label }}
              </button>
            </div>
          </div>
          <Bar :data="chartData" :options="chartOptions" style="height:240px" />
        </div>
        <div class="lg:col-span-4 bg-white rounded-2xl border border-line p-6">
          <h2 class="font-display font-semibold text-lg text-ink mb-4">โรงแรมตามสถานะ</h2>
          <div class="flex flex-col gap-3">
            <div v-for="[status, count] in hotelsByStatus" :key="status" class="flex items-center justify-between">
              <StatusBadge entity="hotel" :value="status" size="sm" />
              <span class="font-display font-semibold text-ink">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
