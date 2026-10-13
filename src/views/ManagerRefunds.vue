<script setup>
// src/views/ManagerRefunds.vue — Dedicated Refund Requests Management Page for Managers
import { computed, ref } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { startReview, approveRefund, rejectRefund } from '../services/transitions.js'
import { formatDate } from '../utils/date.js'
import { showToast } from '../utils/toast.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseModal from '../components/common/BaseModal.vue'
import Sidebar from '../components/common/Sidebar.vue'
import HelpFloatingButton from '../components/common/HelpFloatingButton.vue'
import {
  FileText, Search, Hotel, CheckCircle2, XCircle, Clock,
  Filter, AlertCircle, ArrowLeft, ChevronRight
} from '@lucide/vue'

const { session } = useSession()

const allRefunds = computed(() => db['adoga_refunds'] || [])
const allHotels = computed(() => db['adoga_hotels'] || [])
const allBookings = computed(() => db['adoga_bookings'] || [])
const allUsers = computed(() => db['adoga_users'] || [])

// Manager's Hotels
const myHotels = computed(() => {
  const userId = session.value?.userId
  if (!userId) return []
  if (session.value?.role === 'admin') return allHotels.value
  return allHotels.value.filter(h => h.managerId === userId)
})

const myHotelIds = computed(() => myHotels.value.map(h => h.id))

// Refunds belonging to the manager's hotels
const myRefunds = computed(() => {
  return allRefunds.value
    .filter(r => myHotelIds.value.includes(r.hotelId))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
})

// Filters
const searchQuery = ref('')
const selectedStatusFilter = ref('all')
const selectedHotelFilter = ref('all')

const formatPrice = (p) => '฿' + Number(p || 0).toLocaleString()

function getHotelName(hotelId) {
  const h = allHotels.value.find(x => x.id === hotelId)
  return h ? h.name : hotelId
}

function getUserName(userId) {
  const u = allUsers.value.find(x => x.id === userId)
  if (!u) return userId
  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return fullName || u.nickname || u.email || userId
}

// Filtered refunds
const filteredRefunds = computed(() => {
  let list = myRefunds.value

  // Status Filter
  if (selectedStatusFilter.value !== 'all') {
    list = list.filter(r => r.status === selectedStatusFilter.value)
  }

  // Hotel Filter
  if (selectedHotelFilter.value !== 'all') {
    list = list.filter(r => r.hotelId === selectedHotelFilter.value)
  }

  // Search Query
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(r => {
      const rId = String(r.id || '').toLowerCase()
      const bId = String(r.bookingId || '').toLowerCase()
      const hName = getHotelName(r.hotelId).toLowerCase()
      const uName = getUserName(r.userId).toLowerCase()
      const reason = String(r.reason || '').toLowerCase()
      return rId.includes(q) || bId.includes(q) || hName.includes(q) || uName.includes(q) || reason.includes(q)
    })
  }

  return list
})

// Counts for Summary Chips
const totalCount = computed(() => myRefunds.value.length)
const pendingCount = computed(() => myRefunds.value.filter(r => ['submitted', 'reviewing'].includes(r.status)).length)
const approvedCount = computed(() => myRefunds.value.filter(r => r.status === 'approved').length)
const rejectedCount = computed(() => myRefunds.value.filter(r => r.status === 'rejected').length)

// Refund Detail Modal
const showDetailModal = ref(false)
const selectedRefund = ref(null)

function openDetailModal(refund) {
  selectedRefund.value = refund
  showDetailModal.value = true
}

function doApproveFromModal(id) {
  doApprove(id)
  showDetailModal.value = false
}

function openRejectFromModal(id) {
  showDetailModal.value = false
  openReject(id)
}

// Actions
function doStartReview(id) {
  startReview(id)
  showToast('เริ่มการตรวจสอบคำขอคืนเงินแล้ว', 'info')
}

function doApprove(id) {
  approveRefund(id)
  showToast('อนุมัติการคืนเงินเรียบร้อยแล้ว', 'success')
}

// Reject Modal
const showRejectModal = ref(false)
const rejectId = ref('')
const rejectReason = ref('')

function openReject(id) {
  rejectId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

function doReject() {
  if (!rejectReason.value.trim()) return
  rejectRefund(rejectId.value, rejectReason.value.trim())
  showRejectModal.value = false
  showToast('ปฏิเสธคำขอคืนเงินแล้ว', 'info')
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <!-- Sidebar -->
    <Sidebar type="manager" />

    <!-- Main Content -->
    <div class="flex-1 min-w-0 lg:ml-64 overflow-auto">
      <div class="mx-auto max-w-[1240px] px-4 md:px-8 py-8">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <RouterLink to="/manager" class="text-xs text-ink-muted hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium">
                <ArrowLeft class="w-3.5 h-3.5" /> แดชบอร์ดผู้จัดการ
              </RouterLink>
            </div>
            <h1 class="font-display font-semibold text-2xl text-ink">
              ใบขอคืนเงิน (Refund Requests)
            </h1>
            <p class="text-xs md:text-sm text-ink-muted mt-1">
              ตรวจสอบ พิจารณาอนุมัติ หรือปฏิเสธคำขอคืนเงินจากลูกค้าสำหรับโรงแรมของคุณ
            </p>
          </div>

          <!-- Summary Chips -->
          <div class="flex items-center flex-wrap gap-2 text-xs">
            <span class="px-3 py-1.5 rounded-xl bg-white border border-line text-ink font-medium shadow-2xs">
              คำขอทั้งหมด: <strong class="text-indigo-600">{{ totalCount }}</strong>
            </span>
            <span class="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-medium shadow-2xs">
              รอตรวจสอบ: <strong>{{ pendingCount }}</strong>
            </span>
            <span class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium shadow-2xs">
              อนุมัติแล้ว: <strong>{{ approvedCount }}</strong>
            </span>
            <span class="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium shadow-2xs">
              ปฏิเสธ: <strong>{{ rejectedCount }}</strong>
            </span>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="bg-white rounded-2xl border border-line p-4 md:p-5 mb-6 shadow-2xs">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Search -->
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหารหัสคำขอ, รหัสการจอง, ชื่อโรงแรม หรือเหตุผล..."
                class="w-full h-10 pl-9 pr-8 bg-slate-50/50 border border-line rounded-xl text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs font-bold cursor-pointer"
                title="ล้างข้อความค้นหา"
              >
                ✕
              </button>
            </div>

            <!-- Hotel Selector -->
            <div class="sm:w-56">
              <select
                v-model="selectedHotelFilter"
                class="w-full h-10 px-3 bg-slate-50/50 border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="all">ทุกโรงแรม ({{ myHotels.length }} แห่ง)</option>
                <option v-for="h in myHotels" :key="h.id" :value="h.id">
                  {{ h.name }}
                </option>
              </select>
            </div>

            <!-- Status Selector -->
            <div class="sm:w-44">
              <select
                v-model="selectedStatusFilter"
                class="w-full h-10 px-3 bg-slate-50/50 border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="submitted">ยื่นคำขอแล้ว (Submitted)</option>
                <option value="reviewing">กำลังตรวจสอบ (Reviewing)</option>
                <option value="approved">อนุมัติแล้ว (Approved)</option>
                <option value="rejected">ปฏิเสธ (Rejected)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Refunds Table -->
        <div class="bg-white rounded-2xl border border-line overflow-hidden shadow-2xs">
          <div class="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 class="font-display font-semibold text-base md:text-lg text-ink flex items-center gap-2">
              <FileText class="w-5 h-5 text-indigo-600" />
              <span>รายการใบขอคืนเงิน</span>
            </h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {{ filteredRefunds.length }} / {{ myRefunds.length }} รายการ
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-canvas border-b border-line">
                <tr>
                  <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">รหัสใบขอคืนเงิน</th>
                  <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">โรงแรม & รหัสจอง</th>
                  <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">ยอดคืน</th>
                  <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">เหตุผล</th>
                  <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">สถานะ</th>
                  <th class="text-center py-3.5 px-4 text-xs font-semibold text-ink-muted">การจัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <!-- Empty State -->
                <tr v-if="!filteredRefunds.length">
                  <td colspan="6" class="py-12 text-center text-ink-muted">
                    <FileText class="w-10 h-10 text-slate-300 mx-auto mb-2" :stroke-width="1.5" />
                    <p class="font-medium text-ink">ไม่พบรายการใบขอคืนเงิน</p>
                    <p class="text-xs text-ink-muted mt-0.5">ไม่มีคำขอคืนเงินที่ตรงกับเงื่อนไขการค้นหาในขณะนี้</p>
                  </td>
                </tr>

                <!-- Rows -->
                <tr
                  v-for="r in filteredRefunds"
                  :key="r.id"
                  class="hover:bg-slate-50/70 transition-colors"
                >
                  <!-- Refund ID -->
                  <td class="py-3.5 px-4 font-mono text-xs font-semibold text-indigo-700">
                    {{ r.id }}
                  </td>

                  <!-- Hotel & Booking -->
                  <td class="py-3.5 px-4">
                    <p class="font-medium text-ink leading-snug">{{ getHotelName(r.hotelId) }}</p>
                    <p class="text-xs text-ink-muted font-mono mt-0.5">การจอง: {{ r.bookingId }}</p>
                  </td>

                  <!-- Amount -->
                  <td class="py-3.5 px-4 font-display font-bold text-ink tabular-nums whitespace-nowrap">
                    {{ formatPrice(r.amount) }}
                  </td>

                  <!-- Reason -->
                  <td class="py-3.5 px-4 text-ink max-w-xs">
                    <p class="line-clamp-2 text-xs leading-relaxed">{{ r.reason }}</p>
                  </td>

                  <!-- Status -->
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge entity="refund" :value="r.status" size="sm" />
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <div class="flex items-center justify-center gap-1.5 flex-wrap">
                      <BaseButton @click="openDetailModal(r)" variant="ghost" size="sm" class="shadow-2xs">
                        <FileText class="w-3.5 h-3.5 mr-1" /> รายละเอียด
                      </BaseButton>

                      <BaseButton
                        v-if="r.status === 'submitted'"
                        @click="doStartReview(r.id)"
                        variant="outline"
                        size="sm"
                        class="shadow-2xs"
                      >
                        ตรวจสอบ
                      </BaseButton>

                      <BaseButton
                        v-if="['submitted', 'reviewing'].includes(r.status)"
                        @click="doApprove(r.id)"
                        variant="secondary"
                        size="sm"
                        class="shadow-2xs"
                      >
                        อนุมัติ
                      </BaseButton>

                      <BaseButton
                        v-if="['submitted', 'reviewing'].includes(r.status)"
                        @click="openReject(r.id)"
                        variant="danger"
                        size="sm"
                        class="shadow-2xs"
                      >
                        ปฏิเสธ
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- Refund Detail Modal -->
    <BaseModal :open="showDetailModal" @close="showDetailModal = false" title="รายละเอียดใบขอคืนเงิน">
      <div v-if="selectedRefund" class="flex flex-col gap-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-line space-y-2.5">
          <div class="flex justify-between items-center text-sm">
            <span class="text-ink-muted">รหัสใบขอคืนเงิน:</span>
            <span class="font-mono font-bold text-indigo-600">{{ selectedRefund.id }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-ink-muted">โรงแรม:</span>
            <span class="font-semibold text-ink">{{ getHotelName(selectedRefund.hotelId) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-ink-muted">รหัสการจอง:</span>
            <span class="font-mono font-semibold text-ink">{{ selectedRefund.bookingId }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-ink-muted">ผู้ขอคืนเงิน:</span>
            <span class="font-medium text-ink">{{ getUserName(selectedRefund.userId) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-ink-muted">สถานะ:</span>
            <StatusBadge entity="refund" :value="selectedRefund.status" size="sm" />
          </div>
          <div class="flex justify-between items-baseline pt-2 border-t border-line/60">
            <span class="text-sm font-semibold text-ink">ยอดเงินที่ขอคืน:</span>
            <span class="font-display font-bold text-2xl text-indigo-600 tabular-nums">
              {{ formatPrice(selectedRefund.amount) }}
            </span>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">เหตุผลในการขอคืนเงิน:</label>
          <div class="p-3.5 rounded-xl bg-white border border-line text-sm text-ink leading-relaxed font-medium">
            {{ selectedRefund.reason }}
          </div>
        </div>

        <div v-if="selectedRefund.rejectReason" class="space-y-1">
          <label class="text-xs font-bold text-rose-500 uppercase">เหตุผลที่ปฏิเสธ:</label>
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            {{ selectedRefund.rejectReason }}
          </div>
        </div>

        <div class="flex flex-wrap gap-2 justify-end pt-3 border-t border-line">
          <BaseButton @click="showDetailModal = false" variant="ghost" size="md">ปิด</BaseButton>
          <template v-if="['submitted', 'reviewing'].includes(selectedRefund.status)">
            <BaseButton @click="openRejectFromModal(selectedRefund.id)" variant="danger" size="md">
              ปฏิเสธ
            </BaseButton>
            <BaseButton @click="doApproveFromModal(selectedRefund.id)" variant="secondary" size="md">
              อนุมัติ
            </BaseButton>
          </template>
        </div>
      </div>
    </BaseModal>

    <!-- Reject Modal -->
    <BaseModal :open="showRejectModal" @close="showRejectModal = false" title="ปฏิเสธการคืนเงิน">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-ink-muted">กรุณาระบุเหตุผลในการปฏิเสธคำขอคืนเงินเพื่อแจ้งให้ลูกค้าทราบ</p>
        <textarea
          v-model="rejectReason"
          rows="3"
          placeholder="ระบุเหตุผลในการปฏิเสธคำขอคืนเงิน..."
          class="w-full px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-indigo-600 resize-none"
        />
        <div class="flex gap-3 justify-end">
          <BaseButton @click="showRejectModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
          <BaseButton @click="doReject" variant="danger" size="md" :disabled="!rejectReason.trim()">
            ยืนยันปฏิเสธ
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Help Floating Button -->
    <HelpFloatingButton />
  </div>
</template>
