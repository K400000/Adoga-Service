<script setup>
// src/views/AdminApproval.vue
import { computed, ref, watch } from 'vue'
import { db } from '../stores/db.js'
import { approveHotel, rejectHotel } from '../services/transitions.js'
import { formatPrice, formatDateTime } from '../utils/date.js'
import { showToast } from '../utils/toast.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseModal from '../components/common/BaseModal.vue'
import { FALLBACK_IMAGE } from '../constants/images.js'
import { 
  CheckSquare, Settings, LayoutDashboard, Info, Search, ChevronLeft, ChevronRight, 
  MapPin, User, Users, Sparkles, History, FileText, BedDouble, Calendar, ArrowRight, CheckCircle2, Clock, XCircle 
} from '@lucide/vue'
import Sidebar from '../components/common/Sidebar.vue'

// --- Pending Hotels (Approval Section) ---
const pendingHotels = computed(() => (db['adoga_hotels'] || []).filter(h => h.status === 'pending'))

const pendingSearchQuery = ref('')
const pendingCurrentPage = ref(1)
const pendingPageSize = ref(5)

const filteredPendingHotels = computed(() => {
  const query = pendingSearchQuery.value.trim().toLowerCase()
  if (!query) return pendingHotels.value
  return pendingHotels.value.filter(h => {
    const nameMatch = h.name?.toLowerCase().includes(query)
    const locMatch = h.location?.toLowerCase().includes(query)
    const manager = getManager(h.managerId)
    const managerMatch = manager && (
      `${manager.firstName || ''} ${manager.lastName || ''} ${manager.nickname || ''} ${manager.email || ''}`.toLowerCase().includes(query)
    )
    return nameMatch || locMatch || managerMatch
  })
})

watch(pendingSearchQuery, () => {
  pendingCurrentPage.value = 1
})

const pendingTotalPages = computed(() => Math.ceil(filteredPendingHotels.value.length / pendingPageSize.value) || 1)

const paginatedPendingHotels = computed(() => {
  const start = (pendingCurrentPage.value - 1) * pendingPageSize.value
  return filteredPendingHotels.value.slice(start, start + pendingPageSize.value)
})

// --- All Hotels Section ---
const allHotels = computed(() => db['adoga_hotels'] || [])

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const filteredHotels = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allHotels.value
  return allHotels.value.filter(h => {
    const nameMatch = h.name?.toLowerCase().includes(query)
    const locMatch = h.location?.toLowerCase().includes(query)
    const manager = getManager(h.managerId)
    const managerMatch = manager && (
      `${manager.firstName || ''} ${manager.lastName || ''} ${manager.nickname || ''} ${manager.email || ''}`.toLowerCase().includes(query)
    )
    return nameMatch || locMatch || managerMatch
  })
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredHotels.value.length / pageSize.value) || 1)

const paginatedHotels = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredHotels.value.slice(start, start + pageSize.value)
})

// Modals
const showRejectModal = ref(false)
const rejectHotelId = ref('')
const rejectReason = ref('')

const showInfoModal = ref(false)
const selectedHotel = ref(null)
const activeInfoModalTab = ref('info') // 'info' (page 1) | 'logs' (page 2)

function openInfoModal(hotel) {
  selectedHotel.value = hotel
  activeInfoModalTab.value = 'info'
  showInfoModal.value = true
}

function getHotelLogs(hotel) {
  if (!hotel) return []
  if (hotel.editLogs && hotel.editLogs.length > 0) {
    return hotel.editLogs
  }
  // Fallback initial submission log if hotel has no explicit editLogs yet
  const manager = getManager(hotel.managerId)
  const managerName = manager?.nickname || manager?.firstName || hotel.managerId
  return [
    {
      id: `LOG-INIT-${hotel.id}`,
      at: hotel.createdAt || (hotel.statusHistory?.[0]?.at) || new Date().toISOString(),
      editorId: hotel.managerId,
      editorName: managerName,
      action: 'ส่งคำขอเปิดโรงแรมครั้งแรก (ข้อมูลตั้งต้น)',
      status: hotel.status || 'pending',
      changes: [
        { field: 'ชื่อโรงแรม', from: '-', to: hotel.name },
        { field: 'ทำเลที่ตั้ง', from: '-', to: hotel.location },
        { field: 'ราคาเริ่มต้น/คืน', from: '-', to: formatPrice(hotel.pricePerNight) },
        { field: 'ส่วนลด', from: '-', to: hotel.discount ? `${hotel.discount}%` : 'ไม่มีส่วนลด' },
        { field: 'ประเภทห้องพัก', from: '-', to: `${hotel.rooms?.length || 0} ประเภท (${(hotel.rooms || []).reduce((sum, r) => sum + (r.units?.length || 0), 0)} ห้องพัก)` },
        { field: 'สิ่งอำนวยความสะดวก', from: '-', to: hotel.amenities?.length ? hotel.amenities.join(', ') : 'ไม่มี' },
        { field: 'รูปภาพโรงแรม', from: '-', to: `${hotel.images?.length || 0} รูป` }
      ]
    }
  ]
}

function doApproveFromModal(id) {
  doApprove(id)
  showInfoModal.value = false
}

function openRejectFromModal(id) {
  showInfoModal.value = false
  openReject(id)
}

function doApprove(id) {
  approveHotel(id)
  showToast('อนุมัติโรงแรมเรียบร้อยแล้ว', 'success')
}

function openReject(id) {
  rejectHotelId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

function doReject() {
  rejectHotel(rejectHotelId.value, rejectReason.value)
  showToast('ปฏิเสธคำขอเปิดโรงแรมแล้ว', 'info')
  showRejectModal.value = false
}

function getManager(managerId) {
  return (db['adoga_users'] || []).find(u => u.id === managerId)
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <Sidebar type="admin" />
    <div class="flex-1 min-w-0 lg:ml-64 px-4 md:px-8 py-8">
      
      <!-- Pending Approval Header & Search Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="font-display font-semibold text-2xl text-ink">อนุมัติโรงแรม</h1>
          <p class="text-sm text-ink-muted mt-1">
            โรงแรมที่รออนุมัติ {{ pendingHotels.length }} แห่ง
            <span v-if="pendingSearchQuery"> (ค้นพบ {{ filteredPendingHotels.length }} แห่ง)</span>
          </p>
        </div>

        <!-- Search Box to filter pending hotels by name -->
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="pendingSearchQuery"
            type="text"
            placeholder="ค้นหาชื่อโรงแรมที่รออนุมัติ..."
            class="w-full pl-9 pr-8 py-2 text-sm bg-white rounded-xl border border-line focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
          />
          <button
            v-if="pendingSearchQuery"
            @click="pendingSearchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- No Pending Hotels in System -->
      <div v-if="!pendingHotels.length" class="py-16 text-center bg-white rounded-2xl border border-line mb-8 shadow-2xs">
        <p class="text-lg font-medium text-ink mb-1">ไม่มีโรงแรมรออนุมัติ</p>
        <p class="text-sm text-ink-muted">โรงแรมทั้งหมดได้รับการตรวจสอบแล้ว</p>
      </div>

      <!-- Pending Hotels Search Not Found -->
      <div v-else-if="!filteredPendingHotels.length" class="py-16 text-center bg-white rounded-2xl border border-line mb-8 shadow-2xs">
        <p class="text-base font-medium text-ink mb-1">ไม่พบโรงแรมรออนุมัติที่ตรงกับ "{{ pendingSearchQuery }}"</p>
        <p class="text-sm text-ink-muted mb-3">ลองตรวจสอบคำค้นหาหรือพิมพ์ชื่อโรงแรมใหม่อีกครั้ง</p>
        <button
          @click="pendingSearchQuery = ''"
          class="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
        >
          ล้างคำค้นหา
        </button>
      </div>

      <!-- Pending Hotels Cards (Paginated 5 per page) -->
      <div v-else class="flex flex-col gap-4 mb-8">
        <div
          v-for="hotel in paginatedPendingHotels"
          :key="hotel.id"
          class="bg-white rounded-2xl border border-line overflow-hidden shadow-2xs transition-shadow hover:shadow-sm"
        >
          <div class="flex flex-col md:flex-row gap-4 p-6">
            <img
              :src="hotel.images?.[0] || FALLBACK_IMAGE"
              :alt="hotel.name"
              class="w-full md:w-48 h-32 object-cover rounded-xl flex-shrink-0"
              loading="lazy"
            />
            <div class="flex-1">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-display font-semibold text-xl text-ink">{{ hotel.name }}</h3>
                <StatusBadge entity="hotel" value="pending" size="sm" />
              </div>
              <p class="text-sm text-ink-muted flex items-center gap-1.5 mb-1">
                <MapPin class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>{{ hotel.location }}</span>
              </p>
              <p class="text-sm text-ink-muted flex items-center gap-1.5 mb-3">
                <User class="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>ผู้จัดการ: {{ getManager(hotel.managerId)?.nickname || getManager(hotel.managerId)?.firstName || hotel.managerId }}</span>
              </p>
              <p class="text-sm text-ink mb-4">{{ hotel.description }}</p>
              <div class="flex flex-wrap gap-2 mb-4">
                <span
                  v-for="a in hotel.amenities"
                  :key="a"
                  class="text-xs px-2 py-1 rounded-full bg-slate-100 text-ink-muted"
                >
                  {{ a }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2.5">
                <BaseButton @click="openInfoModal(hotel)" variant="outline" size="md">
                  <Info class="w-4 h-4 mr-1" /> ดูข้อมูลโรงแรม
                </BaseButton>
                <BaseButton @click="doApprove(hotel.id)" variant="secondary" size="md">อนุมัติ</BaseButton>
                <BaseButton @click="openReject(hotel.id)" variant="danger" size="md">ปฏิเสธ</BaseButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Box for Pending Hotels (Appears ONLY if > 5 hotels) -->
        <div
          v-if="filteredPendingHotels.length > pendingPageSize"
          class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white rounded-2xl border border-line shadow-2xs"
        >
          <p class="text-xs text-ink-muted">
            แสดง
            <strong>{{ ((pendingCurrentPage - 1) * pendingPageSize) + 1 }}</strong> -
            <strong>{{ Math.min(pendingCurrentPage * pendingPageSize, filteredPendingHotels.length) }}</strong>
            จากทั้งหมด
            <strong>{{ filteredPendingHotels.length }}</strong> โรงแรม
          </p>
          <div class="flex items-center gap-1.5">
            <button
              @click="pendingCurrentPage--"
              :disabled="pendingCurrentPage === 1"
              class="p-1.5 rounded-lg border border-line bg-white text-ink-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            
            <button
              v-for="p in pendingTotalPages"
              :key="p"
              @click="pendingCurrentPage = p"
              :class="[
                'px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                pendingCurrentPage === p
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-line text-slate-600 hover:bg-slate-100'
              ]"
            >
              {{ p }}
            </button>

            <button
              @click="pendingCurrentPage++"
              :disabled="pendingCurrentPage >= pendingTotalPages"
              class="p-1.5 rounded-lg border border-line bg-white text-ink-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="หน้าถัดไป"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- All Hotels Section -->
      <div class="mt-12">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 class="font-display font-semibold text-xl text-ink">โรงแรมทั้งหมด</h2>
            <p class="text-xs text-ink-muted mt-0.5">รวมทั้งหมด {{ filteredHotels.length }} แห่ง</p>
          </div>
          <!-- Search Box -->
          <div class="relative w-full sm:w-72">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อโรงแรม หรือ ทำเล..."
              class="w-full pl-9 pr-8 py-2 text-sm bg-white rounded-xl border border-line focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-line overflow-hidden shadow-2xs">
          <div v-if="!filteredHotels.length" class="py-12 text-center text-ink-muted text-sm">
            ไม่พบโรงแรมที่ค้นหา "{{ searchQuery }}"
          </div>
          <table v-else class="w-full text-sm">
            <thead class="bg-canvas">
              <tr>
                <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">ชื่อ</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">ทำเล</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">สถานะ</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">ผู้จัดการ</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in paginatedHotels" :key="h.id" class="border-t border-line hover:bg-slate-50">
                <td class="py-3 px-4 font-medium text-ink">{{ h.name }}</td>
                <td class="py-3 px-4 text-ink-muted">{{ h.location }}</td>
                <td class="py-3 px-4"><StatusBadge entity="hotel" :value="h.status" size="sm" /></td>
                <td class="py-3 px-4 text-ink-muted">{{ getManager(h.managerId)?.nickname || getManager(h.managerId)?.firstName || h.managerId }}</td>
                <td class="py-3 px-4">
                  <BaseButton @click="openInfoModal(h)" variant="ghost" size="sm">
                    <Info class="w-3.5 h-3.5 mr-1" /> รายละเอียด
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Footer for All Hotels (Appears ONLY if > 5 items) -->
          <div v-if="filteredHotels.length > pageSize" class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border-t border-line">
            <p class="text-xs text-ink-muted">
              แสดง <strong>{{ ((currentPage - 1) * pageSize) + 1 }}</strong> - <strong>{{ Math.min(currentPage * pageSize, filteredHotels.length) }}</strong> จาก <strong>{{ filteredHotels.length }}</strong> โรงแรม
            </p>
            <div class="flex items-center gap-1.5">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="p-1.5 rounded-lg border border-line bg-white text-ink-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="หน้าก่อนหน้า"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              
              <button
                v-for="p in totalPages"
                :key="p"
                @click="currentPage = p"
                :class="[
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  currentPage === p
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-line text-slate-600 hover:bg-slate-100'
                ]"
              >
                {{ p }}
              </button>

              <button
                @click="currentPage++"
                :disabled="currentPage >= totalPages"
                class="p-1.5 rounded-lg border border-line bg-white text-ink-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="หน้าถัดไป"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <BaseModal :open="showRejectModal" @close="showRejectModal = false" title="ปฏิเสธโรงแรม">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-ink-muted">กรุณาระบุเหตุผลเพื่อแจ้งผู้จัดการโรงแรม</p>
        <textarea v-model="rejectReason" rows="3" placeholder="เหตุผล..." class="w-full px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-rose-500 resize-none" />
        <div class="flex gap-3 justify-end">
          <BaseButton @click="showRejectModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
          <BaseButton @click="doReject" variant="danger" size="md" :disabled="!rejectReason.trim()">ยืนยันปฏิเสธ</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Hotel Detailed Info Modal -->
    <BaseModal :open="showInfoModal" @close="showInfoModal = false" title="ข้อมูลรายละเอียดโรงแรม" size="3xl">
      <div v-if="selectedHotel" class="flex flex-col gap-4">
        <!-- Tab Navigation (Page 1 vs Page 2) -->
        <div class="flex items-center gap-2 border-b border-line pb-3 -mt-1">
          <button
            type="button"
            @click="activeInfoModalTab = 'info'"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              activeInfoModalTab === 'info'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            ]"
          >
            <FileText class="w-4 h-4" />
            <span>หน้า 1: ข้อมูลรายละเอียดโรงแรม</span>
          </button>
          
          <button
            type="button"
            @click="activeInfoModalTab = 'logs'"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              activeInfoModalTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            ]"
          >
            <History class="w-4 h-4" />
            <span>หน้า 2: ประวัติการส่งแก้ไข & LOG</span>
          </button>
        </div>

        <!-- PAGE 1: Hotel Information -->
        <div v-show="activeInfoModalTab === 'info'" class="flex flex-col gap-5">
          <!-- Header Info Card -->
          <div class="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 class="font-display font-bold text-xl sm:text-2xl text-ink">{{ selectedHotel.name }}</h3>
                <StatusBadge entity="hotel" :value="selectedHotel.status" size="sm" />
              </div>
              <p class="text-sm text-ink-muted flex items-center gap-1.5 mb-1">
                <MapPin class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span class="font-medium">{{ selectedHotel.location }}</span>
              </p>
              <p class="text-xs text-ink-muted flex items-center gap-1">
                <User class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>ผู้จัดการ: <span class="font-semibold text-ink">{{ getManager(selectedHotel.managerId)?.firstName }} {{ getManager(selectedHotel.managerId)?.lastName || '' }}</span>
                <span class="text-slate-400 ml-1">({{ getManager(selectedHotel.managerId)?.email || selectedHotel.managerId }})</span></span>
              </p>
            </div>
            <div class="bg-white p-3.5 rounded-xl border border-line text-right flex-shrink-0 self-start sm:self-auto shadow-2xs">
              <p class="text-xs text-ink-muted font-medium">ราคาเริ่มต้น/คืน</p>
              <p class="font-display font-bold text-2xl text-indigo-600 tabular-nums">
                {{ formatPrice(selectedHotel.pricePerNight) }}
              </p>
              <p v-if="selectedHotel.discount" class="text-xs text-emerald-600 font-semibold">
                ส่วนลด {{ selectedHotel.discount }}%
              </p>
            </div>
          </div>

          <!-- Description -->
          <div>
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รายละเอียด & คำอธิบายที่พัก</h4>
            <p class="text-sm text-ink leading-relaxed bg-white p-4 rounded-xl border border-line">
              {{ selectedHotel.description || 'ไม่มีคำอธิบาย' }}
            </p>
          </div>

          <!-- Amenities -->
          <div>
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">สวัสดิการ & สิ่งอำนวยความสะดวก</h4>
            <div v-if="!selectedHotel.amenities?.length" class="text-xs text-slate-400">ไม่มีข้อมูลสิ่งอำนวยความสะดวก</div>
            <div v-else class="flex flex-wrap gap-2">
              <span v-for="a in selectedHotel.amenities" :key="a" class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5 text-indigo-500" /> {{ a }}
              </span>
            </div>
          </div>

          <!-- Room Types & Total Rooms -->
          <div>
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              ประเภทห้องพัก & จำนวนห้อง ({{ selectedHotel.rooms?.length || 0 }} ประเภท)
            </h4>
            
            <div v-if="!selectedHotel.rooms?.length" class="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-line">
              ยังไม่มีข้อมูลห้องพัก
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="room in selectedHotel.rooms" :key="room.id" class="bg-white p-4 rounded-xl border border-line flex flex-col justify-between shadow-2xs">
                <div>
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h5 class="font-semibold text-sm text-ink">{{ room.type }}</h5>
                      <p class="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <Users class="w-3.5 h-3.5 text-slate-400" />
                        <span>รองรับ {{ room.capacity }} ท่าน</span>
                      </p>
                    </div>
                    <span class="font-display font-bold text-sm text-indigo-600 tabular-nums whitespace-nowrap">{{ formatPrice(room.price) }} / คืน</span>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5 pt-2.5 mt-2 border-t border-slate-100">
                  <span class="text-xs font-medium text-slate-500 self-center mr-1">ห้องพัก:</span>
                  <span v-for="u in room.units" :key="u.no" class="text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono">
                    #{{ u.no }} ({{ u.status }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Images Gallery -->
          <div v-if="selectedHotel.images?.length">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รูปภาพโรงแรม ({{ selectedHotel.images.length }} รูป)</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div
                v-for="(img, idx) in selectedHotel.images"
                :key="idx"
                class="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-xs"
              >
                <img
                  :src="img"
                  alt="Hotel image"
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  @error="$event.target.src=FALLBACK_IMAGE"
                />
                <span class="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                  #{{ idx + 1 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- PAGE 2: LOG History & Audit Trail -->
        <div v-show="activeInfoModalTab === 'logs'" class="flex flex-col gap-4">
          <!-- Logs List -->
          <div v-if="!getHotelLogs(selectedHotel).length" class="py-12 text-center text-slate-400 text-sm">
            ไม่มีประวัติการส่งแก้ไข
          </div>

          <div v-else class="flex flex-col gap-4">
            <div
              v-for="(log, idx) in getHotelLogs(selectedHotel)"
              :key="log.id || idx"
              class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3"
            >
              <!-- Log Item Header -->
              <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
                    #{{ getHotelLogs(selectedHotel).length - idx }}
                  </span>
                  <div>
                    <h5 class="text-sm font-bold text-ink">{{ log.action || 'ส่งแก้ไขข้อมูลโรงแรม' }}</h5>
                    <p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock class="w-3.5 h-3.5" />
                      <span>{{ formatDateTime(log.at) }}</span>
                      <span class="mx-1">•</span>
                      <span>โดย: <strong class="text-slate-600">{{ getManager(log.editorId)?.nickname || getManager(log.editorId)?.firstName || log.editorName || log.editorId }}</strong></span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    v-if="log.status === 'approved'"
                    class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> อนุมัติแล้ว
                  </span>
                  <span
                    v-else-if="log.status === 'rejected'"
                    class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"
                  >
                    <XCircle class="w-3.5 h-3.5 text-rose-600" /> ปฏิเสธ
                  </span>
                  <span
                    v-else
                    class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
                  >
                    <Clock class="w-3.5 h-3.5 text-amber-600" /> รอตรวจสอบ (pending)
                  </span>
                </div>
              </div>

              <!-- Changes Table -->
              <div class="overflow-x-auto rounded-lg border border-slate-100">
                <table class="w-full text-xs">
                  <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th class="py-2 px-3 text-left w-1/4">หัวข้อที่แก้ไข / รายการ</th>
                      <th class="py-2 px-3 text-left w-3/8 text-slate-400">ข้อมูลเดิม</th>
                      <th class="py-2 px-3 text-left w-3/8 text-indigo-700">ข้อมูลใหม่ที่ส่งมา</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(change, cIdx) in log.changes" :key="cIdx" class="hover:bg-slate-50/50">
                      <td class="py-2 px-3 font-semibold text-slate-700 align-top">
                        {{ change.field }}
                      </td>
                      <td class="py-2 px-3 text-slate-500 font-mono text-[11px] align-top bg-slate-50/30">
                        <span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 max-w-full break-words">
                          {{ change.from }}
                        </span>
                      </td>
                      <td class="py-2 px-3 font-mono text-[11px] align-top">
                        <span class="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold border border-indigo-100 max-w-full break-words">
                          {{ change.to }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer (Permanently pinned at bottom) -->
      <template #footer v-if="selectedHotel && selectedHotel.status === 'pending'">
        <div class="flex items-center justify-end gap-2.5">
          <BaseButton @click="openRejectFromModal(selectedHotel.id)" variant="danger" size="md">
            ปฏิเสธ
          </BaseButton>
          <BaseButton @click="doApproveFromModal(selectedHotel.id)" variant="secondary" size="md">
            อนุมัติโรงแรม
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
