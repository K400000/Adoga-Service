<script setup>
// src/views/AdminDashboard.vue
import { computed, ref } from 'vue'
import { db } from '../stores/db.js'
import { formatPrice, formatDate } from '../utils/date.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import Sidebar from '../components/common/Sidebar.vue'
import { Users, Hotel, Calendar, DollarSign, Printer } from '@lucide/vue'
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

const printDateFormatted = computed(() => formatDate(new Date().toISOString()))

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

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => `฿${(v/1000).toFixed(0)}K` } } } }

const hotelsByStatus = computed(() => {
  const counts = {}
  for (const h of hotels.value) counts[h.status] = (counts[h.status] || 0) + 1
  return Object.entries(counts)
})

function printPdf() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <!-- Sidebar -->
    <Sidebar type="admin" class="print:hidden" />

    <!-- Content Area -->
    <div class="flex-1 min-w-0 lg:ml-64 px-4 md:px-8 py-8 print:ml-0 print:p-0 print:w-full">
      <!-- Header with Print Button -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 print:mb-4">
        <div>
          <h1 class="font-display font-bold text-2xl md:text-3xl text-ink">ภาพรวมและสถิติระบบ</h1>
          <p class="hidden print:block text-xs text-slate-500 mt-1">
            รายงานสรุปข้อมูลสถิติและรายได้ระบบ Adoga Service • ข้อมูล ณ วันที่ {{ printDateFormatted }}
          </p>
        </div>

        <button
          @click="printPdf"
          type="button"
          class="flex items-center justify-center gap-2 px-4 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-200 cursor-pointer print:hidden self-start sm:self-auto"
        >
          <Printer class="w-4 h-4" :stroke-width="2" />
          <span>พิมพ์รายงาน PDF</span>
        </button>
      </div>

      <!-- Stats 4 col -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:grid-cols-4 print:gap-3 print:mb-4">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl border border-line p-4 md:p-6 print:p-3 print:rounded-xl">
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center mb-3 print:mb-1 print:w-8 print:h-8', stat.color]">
            <component :is="stat.icon" class="w-5 h-5 print:w-4 print:h-4" :stroke-width="1.75" />
          </div>
          <p class="text-2xl font-display font-semibold text-ink tabular-nums print:text-xl">{{ stat.value }}</p>
          <p class="text-sm text-ink-muted mt-1 print:text-xs">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Chart 8 + Hotel status 4 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 print:grid-cols-12 print:gap-4 print:mb-0">
        <div class="lg:col-span-8 bg-white rounded-2xl border border-line p-6 print:col-span-8 print:p-4 print:rounded-xl">
          <div class="flex items-center justify-between mb-4 print:mb-2">
            <h2 class="font-display font-semibold text-lg text-ink print:text-sm">กราฟรายได้ ({{ chartTab === 'month' ? 'รายเดือน' : chartTab === '24h' ? '24 ชม.' : 'รายปี' }})</h2>
            <div class="flex bg-slate-100 rounded-full p-1 print:hidden">
              <button v-for="t in [{ key:'24h', label:'24 ชม.' },{ key:'month', label:'รายเดือน' },{ key:'year', label:'รายปี' }]" :key="t.key"
                @click="chartTab = t.key"
                :class="['px-3 h-7 rounded-full text-xs font-medium transition-colors', chartTab === t.key ? 'bg-indigo-600 text-white' : 'text-ink-muted']">
                {{ t.label }}
              </button>
            </div>
          </div>
          <div class="w-full h-60 print:h-52">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <div class="lg:col-span-4 bg-white rounded-2xl border border-line p-6 print:col-span-4 print:p-4 print:rounded-xl">
          <h2 class="font-display font-semibold text-lg text-ink mb-4 print:text-sm print:mb-2">โรงแรมตามสถานะ</h2>
          <div class="flex flex-col gap-3 print:gap-2">
            <div v-for="[status, count] in hotelsByStatus" :key="status" class="flex items-center justify-between">
              <StatusBadge entity="hotel" :value="status" size="sm" />
              <span class="font-display font-semibold text-ink print:text-xs">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm;
  }
  body {
    background-color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print\:hidden {
    display: none !important;
  }
}
</style>

