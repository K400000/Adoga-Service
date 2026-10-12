<script setup>
// src/views/AdminDashboard.vue
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { db } from '../stores/db.js'
import { formatPrice, formatDate } from '../utils/date.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import Sidebar from '../components/common/Sidebar.vue'
import {
  Users, Hotel, Calendar, DollarSign, Printer, X,
  FileText
} from '@lucide/vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const users = computed(() => db['adoga_users'] || [])
const hotels = computed(() => db['adoga_hotels'] || [])
const bookings = computed(() => db['adoga_bookings'] || [])

// Financial & Operational Metrics
const totalRevenue = computed(() =>
  bookings.value.filter(b => b.paymentStatus === 'success').reduce((s, b) => s + b.totalPrice, 0)
)

const stats = computed(() => [
  { label: 'ผู้ใช้ทั้งหมด', value: users.value.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'โรงแรม Active', value: hotels.value.filter(h => h.status === 'approved').length, icon: Hotel, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'การจองทั้งหมด', value: bookings.value.length, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
  { label: 'รายได้รวม', value: formatPrice(totalRevenue.value), icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
])

// Detailed counts for executive document tables
const usersByRole = computed(() => ({
  admin: users.value.filter(u => u.role === 'admin').length,
  manager: users.value.filter(u => u.role === 'manager').length,
  user: users.value.filter(u => u.role === 'user').length,
}))

const approvedHotelsCount = computed(() => hotels.value.filter(h => h.status === 'approved').length)
const pendingHotelsCount = computed(() => hotels.value.filter(h => h.status === 'pending').length)
const rejectedHotelsCount = computed(() => hotels.value.filter(h => h.status === 'rejected').length)
const suspendedHotelsCount = computed(() => hotels.value.filter(h => h.status === 'suspended').length)

const successPaymentBookings = computed(() => bookings.value.filter(b => b.paymentStatus === 'success'))
const completedBookingsCount = computed(() => bookings.value.filter(b => b.status === 'completed').length)
const confirmedBookingsCount = computed(() => bookings.value.filter(b => b.status === 'confirmed').length)
const pendingPaymentCount = computed(() => bookings.value.filter(b => b.status === 'pending_payment').length)
const cancelledRefundedCount = computed(() => bookings.value.filter(b => b.status === 'cancelled' || b.paymentStatus === 'refunded').length)

const chartTab = ref('month')
const monthLabels = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

// Document Metadata
const printDocId = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-01`
})

const printDateTimeFormatted = computed(() => {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`
  return `${formatDate(now.toISOString())} เวลา ${time}`
})

const printDateOnlyFormatted = computed(() => {
  return formatDate(new Date().toISOString())
})

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
      datasets: [{ label: 'รายได้ (฿)', data: monthly, backgroundColor: '#1e3a8a', borderRadius: 0 }]
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
      datasets: [{ label: 'รายได้ (฿)', data: hours, backgroundColor: '#1e3a8a', borderRadius: 0 }]
    }
  }
  // year (last 5 years)
  const thisYear = new Date().getFullYear()
  const years = [thisYear-4, thisYear-3, thisYear-2, thisYear-1, thisYear]
  const yearly = years.map(y => completed.filter(b => new Date(b.createdAt).getFullYear() === y).reduce((s, b) => s + b.totalPrice, 0))
  return {
    labels: years.map(String),
    datasets: [{ label: 'รายได้ (฿)', data: yearly, backgroundColor: '#1e3a8a', borderRadius: 0 }]
  }
})

const currentChartTotal = computed(() => {
  const ds = chartData.value?.datasets?.[0]?.data || []
  return ds.reduce((acc, v) => acc + (Number(v) || 0), 0)
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    x: {
      grid: { color: '#e2e8f0' },
      ticks: { color: '#334155', font: { size: 10, family: 'sans-serif' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: {
        color: '#334155',
        font: { size: 10, family: 'sans-serif' },
        callback: v => `฿${(v/1000).toFixed(0)}K`
      }
    }
  }
}

const hotelsByStatus = computed(() => {
  const counts = {}
  for (const h of hotels.value) counts[h.status] = (counts[h.status] || 0) + 1
  return Object.entries(counts)
})

// Document Preview & Print State
const showPrintModal = ref(false)
const chartRef = ref(null)
const chartImage = ref(null)

function captureChart() {
  if (chartRef.value?.chart) {
    try {
      chartImage.value = chartRef.value.chart.toBase64Image('image/png', 1)
    } catch (e) {
      console.warn('captureChart failed:', e)
    }
  }
}

function openPrintModal() {
  captureChart()
  showPrintModal.value = true
  nextTick(() => {
    captureChart()
  })
}

function closePrintModal() {
  showPrintModal.value = false
}

function printPdf() {
  captureChart()
  nextTick(() => {
    window.print()
  })
}

watch(chartTab, () => {
  setTimeout(() => {
    captureChart()
  }, 200)
})

onMounted(() => {
  setTimeout(() => {
    captureChart()
  }, 400)
  window.addEventListener('beforeprint', captureChart)
})
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <!-- Sidebar (Hidden in print) -->
    <Sidebar type="admin" class="print:hidden" />

    <!-- Content Area (Dashboard Screen View) -->
    <div class="flex-1 min-w-0 lg:ml-64 px-4 md:px-8 py-8 print:hidden">
      <!-- Header with Print Button -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="font-display font-bold text-2xl md:text-3xl text-ink">ภาพรวมและสถิติระบบ</h1>
          <p class="text-xs text-slate-500 mt-1">
            รายงานสรุปข้อมูลสถิติและรายได้ระบบ Adoga Service • ข้อมูล ณ วันที่ {{ printDateTimeFormatted }}
          </p>
        </div>

        <button
          @click="openPrintModal"
          type="button"
          class="flex items-center justify-center gap-2 px-5 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm transition-all shadow-md shadow-indigo-200 cursor-pointer self-start sm:self-auto"
        >
          <Printer class="w-4 h-4" :stroke-width="2" />
          <span>พิมพ์รายงานเอกสาร PDF (A4 แนวตั้ง)</span>
        </button>
      </div>

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
            <h2 class="font-display font-semibold text-lg text-ink">กราฟรายได้ ({{ chartTab === 'month' ? 'รายเดือน' : chartTab === '24h' ? '24 ชม.' : 'รายปี' }})</h2>
            <div class="flex bg-slate-100 rounded-full p-1">
              <button v-for="t in [{ key:'24h', label:'24 ชม.' },{ key:'month', label:'รายเดือน' },{ key:'year', label:'รายปี' }]" :key="t.key"
                @click="chartTab = t.key"
                :class="['px-3 h-7 rounded-full text-xs font-medium transition-colors cursor-pointer', chartTab === t.key ? 'bg-indigo-600 text-white' : 'text-ink-muted']">
                {{ t.label }}
              </button>
            </div>
          </div>
          <div class="w-full h-64">
            <Bar ref="chartRef" :data="chartData" :options="chartOptions" />
          </div>
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

    <!-- Screen Preview Modal for Document Sheet -->
    <div
      v-if="showPrintModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto no-print"
    >
      <div class="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300 my-auto">
        <!-- Top Action Bar -->
        <div class="bg-white px-6 py-3.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <FileText class="w-5 h-5 text-slate-700" />
            <div>
              <h3 class="font-bold text-slate-900 text-sm sm:text-base">
                ตัวอย่างเอกสารสรุปรายงานสถิติและผลการดำเนินงาน (รูปแบบเอกสารทางการ A4)
              </h3>
              <p class="text-xs text-slate-500">
                เลขที่: ADM-RPT-{{ printDocId }} • ออกเมื่อ {{ printDateTimeFormatted }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Period Selector in Modal -->
            <div class="flex bg-slate-100 rounded-lg p-0.5 border border-slate-300 text-xs">
              <button
                v-for="t in [{ key:'24h', label:'24 ชม.' },{ key:'month', label:'รายเดือน' },{ key:'year', label:'รายปี' }]"
                :key="t.key"
                @click="chartTab = t.key"
                :class="['px-3 py-1 font-medium rounded cursor-pointer transition-colors', chartTab === t.key ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900']"
              >
                {{ t.label }}
              </button>
            </div>

            <button
              @click="printPdf"
              type="button"
              class="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>

            <button
              @click="closePrintModal"
              type="button"
              class="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Document Preview Canvas Area -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 flex justify-center">
          <!-- The Document Sheet Previewed on Screen (Identical structure to printable sheet) -->
          <div class="bg-white w-full max-w-[794px] p-8 sm:p-10 border border-slate-300 shadow-xl text-slate-900 font-sans">
            
            <!-- 1. Formal Letterhead & Metadata Table -->
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
              <div class="flex-1">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-xl font-bold tracking-tight text-slate-900 font-serif">ADOGA SERVICE</span>
                  <span class="text-xs text-slate-600 font-medium">| บริษัท อาโดก้า เซอร์วิส จำกัด (มหาชน)</span>
                </div>
                <p class="text-[11px] text-slate-600 leading-relaxed">
                  123 อาคารอาโดก้า ทาวเวอร์ ชั้น 18 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110<br />
                  เลขประจำตัวผู้เสียภาษีอากร: 0105566099881 · โทรศัพท์: 02-123-4567 · เว็บไซต์: www.adoga-service.com
                </p>
              </div>

              <!-- Metadata Box (Clean Bordered Box) -->
              <div class="border border-slate-400 bg-slate-50/50 p-2.5 text-xs sm:w-60 flex-shrink-0">
                <div class="grid grid-cols-3 gap-1 pb-1 border-b border-slate-300">
                  <span class="text-slate-500 font-medium col-span-1">เลขที่เอกสาร:</span>
                  <span class="font-bold text-slate-900 col-span-2 font-mono">ADM-RPT-{{ printDocId }}</span>
                </div>
                <div class="grid grid-cols-3 gap-1 py-1 border-b border-slate-300">
                  <span class="text-slate-500 font-medium col-span-1">วันที่ออก:</span>
                  <span class="font-medium text-slate-900 col-span-2">{{ printDateOnlyFormatted }}</span>
                </div>
                <div class="grid grid-cols-3 gap-1 pt-1">
                  <span class="text-slate-500 font-medium col-span-1">ผู้ออกรายงาน:</span>
                  <span class="font-medium text-slate-900 col-span-2">ส่วนกลาง (Admin)</span>
                </div>
              </div>
            </div>

            <!-- 2. Formal Subject / Title -->
            <div class="py-4 text-center border-b border-slate-300 mb-4">
              <h2 class="text-base font-bold text-slate-900 font-serif tracking-wide">
                รายงานสรุปสถิติและผลการดำเนินงานระบบ ประจำงวด
              </h2>
              <p class="text-xs text-slate-600 mt-1">
                (Executive System Summary & Operations Performance Report)
              </p>
              <div class="flex justify-between items-center text-[11px] text-slate-500 mt-2 px-1">
                <span><strong>เรียน:</strong> คณะกรรมการและผู้บริหาร บริษัท อาโดก้า เซอร์วิส จำกัด (มหาชน)</span>
                <span><strong>เวลาประมวลผล:</strong> {{ printDateTimeFormatted }}</span>
              </div>
            </div>

            <!-- 3. Section 1: Formal KPI Summary Table (Replaces Modern Card Blobs) -->
            <div class="mb-4">
              <h3 class="font-bold text-xs text-slate-900 mb-1.5 flex items-center gap-1">
                <span>๑. สรุปตัวชี้วัดสำคัญของระบบ (Executive Key Metrics Summary)</span>
              </h3>
              <table class="w-full text-xs border border-slate-400 border-collapse">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                    <th class="border border-slate-400 px-3 py-1.5 text-center w-12">ลำดับ</th>
                    <th class="border border-slate-400 px-3 py-1.5 text-left">รายการตัวชี้วัด (Key Indicator)</th>
                    <th class="border border-slate-400 px-3 py-1.5 text-center w-32">จำนวน / ข้อมูลจริง</th>
                    <th class="border border-slate-400 px-3 py-1.5 text-left">รายละเอียดและข้อมูลจำแนก</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-300 text-slate-800">
                  <tr>
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-medium">1</td>
                    <td class="border border-slate-400 px-3 py-1.5 font-bold">จำนวนบัญชีผู้ใช้งานทั้งหมด</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-bold text-slate-900 tabular-nums">{{ users.length }} ราย</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-slate-600">ผู้ดูแลระบบ: {{ usersByRole.admin }} · โรงแรม: {{ usersByRole.manager }} · ผู้ใช้ทั่วไป: {{ usersByRole.user }}</td>
                  </tr>
                  <tr>
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-medium">2</td>
                    <td class="border border-slate-400 px-3 py-1.5 font-bold">โรงแรมพันธมิตรที่เปิดให้บริการ (Active)</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-bold text-slate-900 tabular-nums">{{ approvedHotelsCount }} แห่ง</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-slate-600">คิดเป็น {{ Math.round(approvedHotelsCount / (hotels.length || 1) * 100) }}% จากทั้งหมด {{ hotels.length }} แห่ง (รอการตรวจสอบ {{ pendingHotelsCount }} แห่ง)</td>
                  </tr>
                  <tr>
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-medium">3</td>
                    <td class="border border-slate-400 px-3 py-1.5 font-bold">ธุรกรรมการจองที่พักทั้งหมด</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-bold text-slate-900 tabular-nums">{{ bookings.length }} รายการ</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-slate-600">เข้าพักสำเร็จ: {{ completedBookingsCount }} · ยืนยัน/รอเข้าพัก: {{ confirmedBookingsCount }} รายการ</td>
                  </tr>
                  <tr class="bg-slate-50/70 font-semibold">
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-medium">4</td>
                    <td class="border border-slate-400 px-3 py-1.5 font-bold text-slate-900">ยอดรายได้รวมสุทธิ (Total Revenue)</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-center font-bold text-slate-900 tabular-nums">{{ formatPrice(totalRevenue) }}</td>
                    <td class="border border-slate-400 px-3 py-1.5 text-slate-600">จากรายการชำระเงินสำเร็จ {{ successPaymentBookings.length }} รายการ (คิดเป็น {{ Math.round(successPaymentBookings.length / (bookings.length || 1) * 100) }}% ของการจอง)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 4. Section 2: Revenue Chart as Formal Document Figure -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-bold text-xs text-slate-900">
                  <span>๒. แผนภูมิแสดงแนวโน้มรายได้ (Revenue Trends Analysis)</span>
                </h3>
                <span class="text-[11px] text-slate-500">หน่วย: บาท (THB)</span>
              </div>

              <!-- Sharp formal frame for chart (No SaaS blobs) -->
              <div class="border border-slate-400 p-2.5 bg-white">
                <div class="w-full h-44 flex items-center justify-center">
                  <img v-if="chartImage" :src="chartImage" class="w-full h-44 object-contain" alt="Revenue Chart" />
                  <div v-else class="text-xs text-slate-400">กำลังประมวลผลแผนภูมิ...</div>
                </div>
                <p class="text-center text-[10px] text-slate-600 mt-1 border-t border-slate-200 pt-1 font-medium">
                  แผนภูมิที่ ๑: แสดงแนวโน้มรายได้สุทธิระบบ Adoga Service ({{ chartTab === 'month' ? 'รายเดือน ประจำปี 2026' : chartTab === '24h' ? '24 ชั่วโมงล่าสุด' : 'สถิติรายปี ย้อนหลัง 5 ปี' }})
                </p>
              </div>

              <!-- Document mini tabular summary bar -->
              <table class="w-full text-xs border border-t-0 border-slate-400 border-collapse bg-slate-50/60">
                <tbody>
                  <tr>
                    <td class="border border-slate-400 px-3 py-1 text-slate-600">ยอดรวมตามแผนภูมิ:</td>
                    <td class="border border-slate-400 px-3 py-1 font-bold text-slate-900 tabular-nums">{{ formatPrice(currentChartTotal) }}</td>
                    <td class="border border-slate-400 px-3 py-1 text-slate-600">รายการชำระเงินสำเร็จ:</td>
                    <td class="border border-slate-400 px-3 py-1 font-bold text-slate-900 tabular-nums">{{ successPaymentBookings.length }} รายการ</td>
                    <td class="border border-slate-400 px-3 py-1 text-slate-600">เฉลี่ยต่อรายการ:</td>
                    <td class="border border-slate-400 px-3 py-1 font-bold text-slate-900 tabular-nums">{{ formatPrice(Math.round(totalRevenue / (successPaymentBookings.length || 1))) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 5. Section 3: Operational Breakdown Formal Tables -->
            <div class="mb-5">
              <h3 class="font-bold text-xs text-slate-900 mb-1.5">
                <span>๓. ตารางแจกแจงสถานะโรงแรมและธุรกรรมการจอง (Operational Breakdown)</span>
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <!-- Hotels Table -->
                <table class="w-full text-xs border border-slate-400 border-collapse">
                  <thead>
                    <tr class="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                      <th class="border border-slate-400 px-2.5 py-1 text-left">สถานะโรงแรม (Hotels)</th>
                      <th class="border border-slate-400 px-2.5 py-1 text-right w-16">จำนวน</th>
                      <th class="border border-slate-400 px-2.5 py-1 text-right w-16">สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-800">
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">อนุมัติแล้ว (Approved)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ approvedHotelsCount }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(approvedHotelsCount / (hotels.length || 1) * 100) }}%</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">รอการตรวจสอบ (Pending)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ pendingHotelsCount }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(pendingHotelsCount / (hotels.length || 1) * 100) }}%</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">ปฏิเสธคำขอ (Rejected)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ rejectedHotelsCount }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(rejectedHotelsCount / (hotels.length || 1) * 100) }}%</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">ระงับการให้บริการ (Suspended)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ suspendedHotelsCount }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(suspendedHotelsCount / (hotels.length || 1) * 100) }}%</td>
                    </tr>
                    <tr class="bg-slate-100 font-bold border-t border-slate-400">
                      <td class="border border-slate-400 px-2.5 py-1">รวมโรงแรมทั้งหมด</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right tabular-nums">{{ hotels.length }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right">100%</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Bookings Table -->
                <table class="w-full text-xs border border-slate-400 border-collapse">
                  <thead>
                    <tr class="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                      <th class="border border-slate-400 px-2.5 py-1 text-left">สถานะการจอง (Bookings)</th>
                      <th class="border border-slate-400 px-2.5 py-1 text-right w-16">จำนวน</th>
                      <th class="border border-slate-400 px-2.5 py-1 text-right w-16">สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-800">
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">ชำระเงินสำเร็จ (Payment Success)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ successPaymentBookings.length }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(successPaymentBookings.length / (bookings.length || 1) * 100) }}%</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">เสร็จสิ้นสมบูรณ์ (Completed)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ completedBookingsCount }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(completedBookingsCount / (bookings.length || 1) * 100) }}%</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">รอการชำระเงิน (Pending)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ pendingPaymentCount }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(pendingPaymentCount / (bookings.length || 1) * 100) }}%</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-400 px-2.5 py-1">ยกเลิก / คืนเงิน (Cancelled)</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right font-medium tabular-nums">{{ cancelledRefundedCount }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right text-slate-600 tabular-nums">{{ Math.round(cancelledRefundedCount / (bookings.length || 1) * 100) }}%</td>
                    </tr>
                    <tr class="bg-slate-100 font-bold border-t border-slate-400">
                      <td class="border border-slate-400 px-2.5 py-1">รวมรายการทั้งหมด</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right tabular-nums">{{ bookings.length }}</td>
                      <td class="border border-slate-400 px-2.5 py-1 text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 6. Section 4: Endorsement & Formal Signatures -->
            <div class="pt-3 border-t border-slate-300">
              <p class="text-[10px] text-slate-600 mb-3 italic">
                * คำรับรอง: ข้าพเจ้าขอรับรองว่า ข้อมูลสถิติและตัวเลขผลการดำเนินงานที่ระบุในเอกสารฉบับนี้ ได้รับการประมวลผลจากฐานข้อมูลระบบ Adoga Service โดยถูกต้องตรงตามความเป็นจริงทุกประการ
              </p>

              <div class="grid grid-cols-2 gap-8 text-center text-xs">
                <!-- Prepared By -->
                <div class="space-y-4">
                  <p class="font-bold text-slate-800">ผู้จัดทำรายงาน (Prepared By)</p>
                  <div class="pt-6">
                    <p class="text-slate-400">ลงชื่อ ..............................................................</p>
                    <p class="text-slate-700 font-medium mt-1">( ผู้ดูแลระบบงานส่วนกลาง / System Admin )</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">วันที่: ...... / ...... / ...........</p>
                  </div>
                </div>

                <!-- Approved By -->
                <div class="space-y-4 relative">
                  <p class="font-bold text-slate-800">ผู้ตรวจสอบและอนุมัติ (Approved By)</p>
                  
                  <!-- Formal Circular Stamp Seal -->
                  <div class="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-indigo-700 rounded-full flex items-center justify-center text-indigo-700 opacity-60 pointer-events-none rotate-[-10deg]">
                    <div class="text-[8px] font-bold text-center leading-tight">
                      <div>ADOGA SERVICE</div>
                      <div class="text-[6px] tracking-widest mt-0.5">OFFICIAL SEAL</div>
                    </div>
                  </div>

                  <div class="pt-6">
                    <p class="text-slate-400">ลงชื่อ ..............................................................</p>
                    <p class="text-slate-700 font-medium mt-1">( ผู้อำนวยการฝ่ายปฏิบัติการ / Operations Director )</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">วันที่: ...... / ...... / ...........</p>
                  </div>
                </div>
              </div>

              <!-- Formal Document Footer -->
              <div class="flex justify-between items-center text-[10px] text-slate-400 pt-3 mt-4 border-t border-slate-200">
                <span>เอกสารนี้ออกโดยระบบอัตโนมัติ Adoga Service • มีผลสมบูรณ์ตามระบบอิเล็กทรอนิกส์</span>
                <span>หน้า ๑ จาก ๑ (Page 1 of 1)</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- PURE PRINTABLE DOCUMENT (Targeted exclusively by @media print) -->
    <div id="admin-doc-printable" class="hidden print:block font-sans text-slate-900 bg-white">
      <!-- 1. Formal Letterhead & Metadata Table -->
      <div class="flex justify-between items-start pb-4 border-b-2 border-slate-900">
        <div class="flex-1 pr-4">
          <div class="flex items-baseline gap-2 mb-1">
            <span class="text-xl font-bold tracking-tight text-slate-900 font-serif">ADOGA SERVICE</span>
            <span class="text-xs text-slate-600 font-medium">| บริษัท อาโดก้า เซอร์วิส จำกัด (มหาชน)</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            123 อาคารอาโดก้า ทาวเวอร์ ชั้น 18 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110<br />
            เลขประจำตัวผู้เสียภาษีอากร: 0105566099881 · โทรศัพท์: 02-123-4567 · เว็บไซต์: www.adoga-service.com
          </p>
        </div>

        <!-- Metadata Box (Clean Bordered Box) -->
        <div class="border border-slate-400 bg-slate-50/50 p-2 text-xs w-60 flex-shrink-0">
          <div class="grid grid-cols-3 gap-1 pb-1 border-b border-slate-300">
            <span class="text-slate-500 font-medium col-span-1">เลขที่เอกสาร:</span>
            <span class="font-bold text-slate-900 col-span-2 font-mono">ADM-RPT-{{ printDocId }}</span>
          </div>
          <div class="grid grid-cols-3 gap-1 py-1 border-b border-slate-300">
            <span class="text-slate-500 font-medium col-span-1">วันที่ออก:</span>
            <span class="font-medium text-slate-900 col-span-2">{{ printDateOnlyFormatted }}</span>
          </div>
          <div class="grid grid-cols-3 gap-1 pt-1">
            <span class="text-slate-500 font-medium col-span-1">ผู้ออกรายงาน:</span>
            <span class="font-medium text-slate-900 col-span-2">ส่วนกลาง (Admin)</span>
          </div>
        </div>
      </div>

      <!-- 2. Formal Subject / Title -->
      <div class="py-3.5 text-center border-b border-slate-300 mb-3.5">
        <h2 class="text-base font-bold text-slate-900 font-serif tracking-wide">
          รายงานสรุปสถิติและผลการดำเนินงานระบบ ประจำงวด
        </h2>
        <p class="text-xs text-slate-600 mt-0.5">
          (Executive System Summary & Operations Performance Report)
        </p>
        <div class="flex justify-between items-center text-[11px] text-slate-500 mt-2 px-1">
          <span><strong>เรียน:</strong> คณะกรรมการและผู้บริหาร บริษัท อาโดก้า เซอร์วิส จำกัด (มหาชน)</span>
          <span><strong>เวลาประมวลผล:</strong> {{ printDateTimeFormatted }}</span>
        </div>
      </div>

      <!-- 3. Section 1: Formal KPI Summary Table -->
      <div class="mb-3.5">
        <h3 class="font-bold text-xs text-slate-900 mb-1 flex items-center gap-1">
          <span>๑. สรุปตัวชี้วัดสำคัญของระบบ (Executive Key Metrics Summary)</span>
        </h3>
        <table class="w-full text-xs border border-slate-400 border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <th class="border border-slate-400 px-3 py-1 text-center w-12">ลำดับ</th>
              <th class="border border-slate-400 px-3 py-1 text-left">รายการตัวชี้วัด (Key Indicator)</th>
              <th class="border border-slate-400 px-3 py-1 text-center w-32">จำนวน / ข้อมูลจริง</th>
              <th class="border border-slate-400 px-3 py-1 text-left">รายละเอียดและข้อมูลจำแนก</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-300 text-slate-800">
            <tr>
              <td class="border border-slate-400 px-3 py-1 text-center font-medium">1</td>
              <td class="border border-slate-400 px-3 py-1 font-bold">จำนวนบัญชีผู้ใช้งานทั้งหมด</td>
              <td class="border border-slate-400 px-3 py-1 text-center font-bold text-slate-900 tabular-nums">{{ users.length }} ราย</td>
              <td class="border border-slate-400 px-3 py-1 text-slate-600">ผู้ดูแลระบบ: {{ usersByRole.admin }} · โรงแรม: {{ usersByRole.manager }} · ผู้ใช้ทั่วไป: {{ usersByRole.user }}</td>
            </tr>
            <tr>
              <td class="border border-slate-400 px-3 py-1 text-center font-medium">2</td>
              <td class="border border-slate-400 px-3 py-1 font-bold">โรงแรมพันธมิตรที่เปิดให้บริการ (Active)</td>
              <td class="border border-slate-400 px-3 py-1 text-center font-bold text-slate-900 tabular-nums">{{ approvedHotelsCount }} แห่ง</td>
              <td class="border border-slate-400 px-3 py-1 text-slate-600">คิดเป็น {{ Math.round(approvedHotelsCount / (hotels.length || 1) * 100) }}% จากทั้งหมด {{ hotels.length }} แห่ง (รอการตรวจสอบ {{ pendingHotelsCount }} แห่ง)</td>
            </tr>
            <tr>
              <td class="border border-slate-400 px-3 py-1 text-center font-medium">3</td>
              <td class="border border-slate-400 px-3 py-1 font-bold">ธุรกรรมการจองที่พักทั้งหมด</td>
              <td class="border border-slate-400 px-3 py-1 text-center font-bold text-slate-900 tabular-nums">{{ bookings.length }} รายการ</td>
              <td class="border border-slate-400 px-3 py-1 text-slate-600">เข้าพักสำเร็จ: {{ completedBookingsCount }} · ยืนยัน/รอเข้าพัก: {{ confirmedBookingsCount }} รายการ</td>
            </tr>
            <tr class="bg-slate-50 font-semibold">
              <td class="border border-slate-400 px-3 py-1 text-center font-medium">4</td>
              <td class="border border-slate-400 px-3 py-1 font-bold text-slate-900">ยอดรายได้รวมสุทธิ (Total Revenue)</td>
              <td class="border border-slate-400 px-3 py-1 text-center font-bold text-slate-900 tabular-nums">{{ formatPrice(totalRevenue) }}</td>
              <td class="border border-slate-400 px-3 py-1 text-slate-600">จากรายการชำระเงินสำเร็จ {{ successPaymentBookings.length }} รายการ (คิดเป็น {{ Math.round(successPaymentBookings.length / (bookings.length || 1) * 100) }}% ของการจอง)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. Section 2: Revenue Chart Figure -->
      <div class="mb-3.5">
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-bold text-xs text-slate-900">
            <span>๒. แผนภูมิแสดงแนวโน้มรายได้ (Revenue Trends Analysis)</span>
          </h3>
          <span class="text-[11px] text-slate-500">หน่วย: บาท (THB)</span>
        </div>

        <div class="border border-slate-400 p-2 bg-white">
          <div class="w-full h-44 flex items-center justify-center">
            <img v-if="chartImage" :src="chartImage" class="w-full h-44 object-contain" alt="Revenue Chart" />
            <Bar v-else :data="chartData" :options="chartOptions" />
          </div>
          <p class="text-center text-[10px] text-slate-600 mt-1 border-t border-slate-200 pt-0.5 font-medium">
            แผนภูมิที่ ๑: แสดงแนวโน้มรายได้สุทธิระบบ Adoga Service ({{ chartTab === 'month' ? 'รายเดือน ประจำปี 2026' : chartTab === '24h' ? '24 ชั่วโมงล่าสุด' : 'สถิติรายปี ย้อนหลัง 5 ปี' }})
          </p>
        </div>

        <table class="w-full text-xs border border-t-0 border-slate-400 border-collapse bg-slate-50">
          <tbody>
            <tr>
              <td class="border border-slate-400 px-3 py-0.5 text-slate-600">ยอดรวมตามแผนภูมิ:</td>
              <td class="border border-slate-400 px-3 py-0.5 font-bold text-slate-900 tabular-nums">{{ formatPrice(currentChartTotal) }}</td>
              <td class="border border-slate-400 px-3 py-0.5 text-slate-600">รายการชำระเงินสำเร็จ:</td>
              <td class="border border-slate-400 px-3 py-0.5 font-bold text-slate-900 tabular-nums">{{ successPaymentBookings.length }} รายการ</td>
              <td class="border border-slate-400 px-3 py-0.5 text-slate-600">เฉลี่ยต่อรายการ:</td>
              <td class="border border-slate-400 px-3 py-0.5 font-bold text-slate-900 tabular-nums">{{ formatPrice(Math.round(totalRevenue / (successPaymentBookings.length || 1))) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 5. Section 3: Operational Breakdown Tables -->
      <div class="mb-4">
        <h3 class="font-bold text-xs text-slate-900 mb-1">
          <span>๓. ตารางแจกแจงสถานะโรงแรมและธุรกรรมการจอง (Operational Breakdown)</span>
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <!-- Hotels Table -->
          <table class="w-full text-xs border border-slate-400 border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <th class="border border-slate-400 px-2.5 py-1 text-left">สถานะโรงแรม (Hotels)</th>
                <th class="border border-slate-400 px-2.5 py-1 text-right w-16">จำนวน</th>
                <th class="border border-slate-400 px-2.5 py-1 text-right w-16">สัดส่วน</th>
              </tr>
            </thead>
            <tbody class="text-slate-800">
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">อนุมัติแล้ว (Approved)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ approvedHotelsCount }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(approvedHotelsCount / (hotels.length || 1) * 100) }}%</td>
              </tr>
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">รอการตรวจสอบ (Pending)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ pendingHotelsCount }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(pendingHotelsCount / (hotels.length || 1) * 100) }}%</td>
              </tr>
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">ปฏิเสธคำขอ (Rejected)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ rejectedHotelsCount }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(rejectedHotelsCount / (hotels.length || 1) * 100) }}%</td>
              </tr>
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">ระงับการให้บริการ (Suspended)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ suspendedHotelsCount }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(suspendedHotelsCount / (hotels.length || 1) * 100) }}%</td>
              </tr>
              <tr class="bg-slate-100 font-bold border-t border-slate-400">
                <td class="border border-slate-400 px-2.5 py-0.5">รวมโรงแรมทั้งหมด</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right tabular-nums">{{ hotels.length }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right">100%</td>
              </tr>
            </tbody>
          </table>

          <!-- Bookings Table -->
          <table class="w-full text-xs border border-slate-400 border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <th class="border border-slate-400 px-2.5 py-1 text-left">สถานะการจอง (Bookings)</th>
                <th class="border border-slate-400 px-2.5 py-1 text-right w-16">จำนวน</th>
                <th class="border border-slate-400 px-2.5 py-1 text-right w-16">สัดส่วน</th>
              </tr>
            </thead>
            <tbody class="text-slate-800">
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">ชำระเงินสำเร็จ (Payment Success)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ successPaymentBookings.length }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(successPaymentBookings.length / (bookings.length || 1) * 100) }}%</td>
              </tr>
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">เสร็จสิ้นสมบูรณ์ (Completed)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ completedBookingsCount }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(completedBookingsCount / (bookings.length || 1) * 100) }}%</td>
              </tr>
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">รอการชำระเงิน (Pending)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ pendingPaymentCount }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(pendingPaymentCount / (bookings.length || 1) * 100) }}%</td>
              </tr>
              <tr>
                <td class="border border-slate-400 px-2.5 py-0.5">ยกเลิก / คืนเงิน (Cancelled)</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right font-medium tabular-nums">{{ cancelledRefundedCount }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right text-slate-600 tabular-nums">{{ Math.round(cancelledRefundedCount / (bookings.length || 1) * 100) }}%</td>
              </tr>
              <tr class="bg-slate-100 font-bold border-t border-slate-400">
                <td class="border border-slate-400 px-2.5 py-0.5">รวมรายการทั้งหมด</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right tabular-nums">{{ bookings.length }}</td>
                <td class="border border-slate-400 px-2.5 py-0.5 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 6. Section 4: Endorsement & Formal Signatures -->
      <div class="pt-2 border-t border-slate-300">
        <p class="text-[10px] text-slate-600 mb-2.5 italic">
          * คำรับรอง: ข้าพเจ้าขอรับรองว่า ข้อมูลสถิติและตัวเลขผลการดำเนินงานที่ระบุในเอกสารฉบับนี้ ได้รับการประมวลผลจากฐานข้อมูลระบบ Adoga Service โดยถูกต้องตรงตามความเป็นจริงทุกประการ
        </p>

        <div class="grid grid-cols-2 gap-8 text-center text-xs">
          <!-- Prepared By -->
          <div class="space-y-3">
            <p class="font-bold text-slate-800">ผู้จัดทำรายงาน (Prepared By)</p>
            <div class="pt-5">
              <p class="text-slate-400">ลงชื่อ ..............................................................</p>
              <p class="text-slate-700 font-medium mt-1">( ผู้ดูแลระบบงานส่วนกลาง / System Admin )</p>
              <p class="text-[11px] text-slate-500 mt-0.5">วันที่: ...... / ...... / ...........</p>
            </div>
          </div>

          <!-- Approved By -->
          <div class="space-y-3 relative">
            <p class="font-bold text-slate-800">ผู้ตรวจสอบและอนุมัติ (Approved By)</p>
            
            <!-- Formal Circular Stamp Seal -->
            <div class="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-indigo-700 rounded-full flex items-center justify-center text-indigo-700 opacity-60 pointer-events-none rotate-[-10deg]">
              <div class="text-[8px] font-bold text-center leading-tight">
                <div>ADOGA SERVICE</div>
                <div class="text-[6px] tracking-widest mt-0.5">OFFICIAL SEAL</div>
              </div>
            </div>

            <div class="pt-5">
              <p class="text-slate-400">ลงชื่อ ..............................................................</p>
              <p class="text-slate-700 font-medium mt-1">( ผู้อำนวยการฝ่ายปฏิบัติการ / Operations Director )</p>
              <p class="text-[11px] text-slate-500 mt-0.5">วันที่: ...... / ...... / ...........</p>
            </div>
          </div>
        </div>

        <!-- Formal Document Footer -->
        <div class="flex justify-between items-center text-[10px] text-slate-400 pt-2.5 mt-3 border-t border-slate-200">
          <span>เอกสารนี้ออกโดยระบบอัตโนมัติ Adoga Service • มีผลสมบูรณ์ตามระบบอิเล็กทรอนิกส์</span>
          <span>หน้า ๑ จาก ๑ (Page 1 of 1)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  body {
    background-color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide regular dashboard UI, sidebar, modal bars */
  .no-print,
  .print\:hidden {
    display: none !important;
  }

  /* Isolate and display ONLY the printable portrait document */
  body:has(#admin-doc-printable) * {
    visibility: hidden !important;
  }

  body:has(#admin-doc-printable) #admin-doc-printable,
  body:has(#admin-doc-printable) #admin-doc-printable * {
    visibility: visible !important;
  }

  body:has(#admin-doc-printable) #admin-doc-printable {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }
}
</style>
