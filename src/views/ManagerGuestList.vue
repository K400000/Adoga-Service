<script setup>
// src/views/ManagerGuestList.vue
import { computed, ref } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { checkIn, checkOut, revertToCheckIn, revertToWaiting } from '../services/transitions.js'
import { formatDate } from '../utils/date.js'
import { showToast } from '../utils/toast.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'
import Sidebar from '../components/common/Sidebar.vue'
import {
  Hotel, Users, MapPin, Search, ChevronLeft, ChevronRight, ChevronDown,
  BedDouble, Calendar, CheckCircle2, Clock, LogIn, Filter
} from '@lucide/vue'

const { session } = useSession()

// Hotels belonging to the manager
const myHotels = computed(() => {
  const userId = session.value?.userId
  if (!userId) return []
  const allHotels = db['adoga_hotels'] || []
  if (session.value?.role === 'admin') return allHotels
  return allHotels.filter(h => h.managerId === userId)
})

const myHotelIds = computed(() => myHotels.value.map(h => h.id))

// All valid bookings for manager's hotels
const allMyBookings = computed(() => {
  const ids = myHotelIds.value
  if (!ids.length) return []

  return (db['adoga_bookings'] || [])
    .filter(b => {
      if (!ids.includes(b.hotelId)) return false
      if (b.status === 'cancelled') return false
      const isPaidOrConfirmed = b.status === 'confirmed' || b.status === 'completed' || b.paymentStatus === 'success' || !!b.checkedInAt
      return isPaidOrConfirmed
    })
    .sort((a, b) => new Date(b.createdAt || a.checkIn) - new Date(a.createdAt || b.checkIn))
})

// Filters
const searchQuery = ref('')
const selectedHotelFilter = ref('all')
const selectedStatusFilter = ref('all')
const onlyWithBookings = ref(true)

// Pagination state: hotelId -> currentPage
const hotelPages = ref({})
const pageSize = 10

function getCurrentPage(hotelId) {
  return hotelPages.value[hotelId] || 1
}

function setHotelPage(hotelId, page) {
  const total = getTotalPages(hotelId)
  const target = Math.max(1, Math.min(page, total))
  hotelPages.value[hotelId] = target
}

function getTotalPages(hotelId) {
  const count = getFilteredBookingsForHotel(hotelId).length
  return Math.max(1, Math.ceil(count / pageSize))
}

function getVisiblePages(hotelId) {
  const total = getTotalPages(hotelId)
  const current = getCurrentPage(hotelId)
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  let start = Math.max(1, current - 2)
  let end = Math.min(total, start + 4)
  if (end - start < 4) {
    start = Math.max(1, end - 4)
  }
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

function getUserName(userId) {
  const u = (db['adoga_users'] || []).find(x => x.id === userId)
  if (!u) return userId
  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return fullName || u.nickname || u.email || userId
}

function getRoomName(hotel, roomId) {
  if (!hotel?.rooms) return ''
  const room = hotel.rooms.find(r => r.id === roomId)
  return room ? room.name : ''
}

const derivedStatus = (b) => {
  if (b.checkedOutAt || b.status === 'completed') return 'completed'
  if (b.checkedInAt && !b.checkedOutAt) return 'checked_in'
  return b.status
}

// Bookings filtered for a specific hotel
function getFilteredBookingsForHotel(hotelId) {
  let list = allMyBookings.value.filter(b => b.hotelId === hotelId)

  // Status Filter
  if (selectedStatusFilter.value !== 'all') {
    list = list.filter(b => derivedStatus(b) === selectedStatusFilter.value)
  }

  // Search Query
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    const hotel = myHotels.value.find(h => h.id === hotelId)
    list = list.filter(b => {
      const uName = getUserName(b.userId).toLowerCase()
      const roomNo = String(b.roomNo || '').toLowerCase()
      const bId = String(b.id || '').toLowerCase()
      const rName = getRoomName(hotel, b.roomId).toLowerCase()
      return uName.includes(q) || roomNo.includes(q) || bId.includes(q) || rName.includes(q)
    })
  }

  return list
}

// Paginated slice for a specific hotel (Max 10 rows per page)
function getPaginatedBookingsForHotel(hotelId) {
  const list = getFilteredBookingsForHotel(hotelId)
  const current = Math.min(getCurrentPage(hotelId), Math.max(1, Math.ceil(list.length / pageSize)))
  const start = (current - 1) * pageSize
  return list.slice(start, start + pageSize)
}

// Counts for badges
function getStatusCounts(hotelId) {
  const allForHotel = allMyBookings.value.filter(b => b.hotelId === hotelId)
  const waiting = allForHotel.filter(b => derivedStatus(b) === 'confirmed').length
  const checkedIn = allForHotel.filter(b => derivedStatus(b) === 'checked_in').length
  const completed = allForHotel.filter(b => derivedStatus(b) === 'completed').length
  return { waiting, checkedIn, completed, total: allForHotel.length }
}

// Hotels to display on the page
const displayedHotels = computed(() => {
  let hotels = myHotels.value

  // Single hotel selected
  if (selectedHotelFilter.value !== 'all') {
    return hotels.filter(h => h.id === selectedHotelFilter.value)
  }

  // Filter only hotels with bookings if toggle is active
  if (onlyWithBookings.value) {
    const withBookings = hotels.filter(h => getFilteredBookingsForHotel(h.id).length > 0)
    // If none match search/status, but some have total bookings, show those with bookings
    if (!withBookings.length && !searchQuery.value && selectedStatusFilter.value === 'all') {
      return hotels
    }
    return withBookings
  }

  return hotels
})

// Total summary across all hotels
const totalGuestsCount = computed(() => allMyBookings.value.length)
const totalWaitingCount = computed(() => allMyBookings.value.filter(b => derivedStatus(b) === 'confirmed').length)
const totalCheckedInCount = computed(() => allMyBookings.value.filter(b => derivedStatus(b) === 'checked_in').length)
const totalCompletedCount = computed(() => allMyBookings.value.filter(b => derivedStatus(b) === 'completed').length)

function doCheckIn(bookingId, guestName) {
  checkIn(bookingId)
  showToast(`เช็คอิน ${guestName || 'ผู้เข้าพัก'} สำเร็จแล้ว`, 'success')
}

function doCheckOut(bookingId, roomNo) {
  checkOut(bookingId)
  showToast(`เช็คเอาท์ห้อง ${roomNo || ''} สำเร็จเรียบร้อย`, 'success')
}

function getBookingAction(b) {
  if (b.checkedOutAt || b.status === 'completed') return 'check_out'
  if (b.checkedInAt) return 'check_in'
  return 'waiting'
}

function getActionBadgeClass(b) {
  const action = getBookingAction(b)
  if (action === 'check_out') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:border-emerald-300'
  }
  if (action === 'check_in') {
    return 'bg-indigo-50 text-indigo-800 border-indigo-200/90 hover:border-indigo-300'
  }
  return 'bg-amber-50 text-amber-900 border-amber-200/90 hover:border-amber-300'
}

function handleActionSelect(b, event) {
  const newAction = event.target.value
  const currentAction = getBookingAction(b)
  if (newAction === currentAction) return

  const guestName = getUserName(b.userId)

  if (newAction === 'check_in') {
    if (b.checkedOutAt) {
      revertToCheckIn(b.id)
    } else {
      checkIn(b.id)
    }
    showToast(`เช็คอิน ${guestName} สำเร็จแล้ว`, 'success')
  } else if (newAction === 'check_out') {
    if (!b.checkedInAt) {
      checkIn(b.id)
    }
    checkOut(b.id)
    showToast(`เช็คเอาท์ห้อง ${b.roomNo || ''} สำเร็จเรียบร้อย`, 'success')
  } else if (newAction === 'waiting') {
    revertToWaiting(b.id)
    showToast(`ปรับสถานะของ ${guestName} เป็น "รอ Check-in" เรียบร้อย`, 'info')
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <!-- Sidebar -->
    <Sidebar type="manager" />

    <!-- Main Content Area -->
    <div class="flex-1 min-w-0 lg:ml-64 overflow-auto">
      <div class="mx-auto max-w-[1240px] px-4 md:px-8 py-8">
        
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="font-display font-semibold text-2xl text-ink">
              จัดการลูกค้า (Check-in / Check-out)
            </h1>
            <p class="text-xs md:text-sm text-ink-muted mt-1">
              ตารางแสดงรายชื่อผู้เข้าพักแยกตามแต่ละโรงแรม พร้อมระบบแบ่งหน้า (10 รายการต่อหน้า)
            </p>
          </div>

          <!-- Overall Summary Chips -->
          <div class="flex items-center flex-wrap gap-2 text-xs">
            <span class="px-3 py-1.5 rounded-xl bg-white border border-line text-ink font-medium shadow-2xs">
              การจองทั้งหมด: <strong class="text-indigo-600">{{ totalGuestsCount }}</strong>
            </span>
            <span class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium shadow-2xs">
              รอเช็คอิน: <strong>{{ totalWaitingCount }}</strong>
            </span>
            <span class="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium shadow-2xs">
              เข้าพักอยู่: <strong>{{ totalCheckedInCount }}</strong>
            </span>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="bg-white rounded-2xl border border-line p-4 mb-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            
            <!-- Search Input -->
            <div class="relative flex-1 min-w-[220px]">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาชื่อลูกค้า, เลขห้อง, รหัสจอง..."
                class="w-full h-10 pl-9 pr-8 bg-slate-50/50 border border-line rounded-xl text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Hotel Selector (แสดงเมื่อดูแลมากกว่า 1 โรงแรมเท่านั้น) -->
            <div v-if="myHotels.length > 1" class="sm:w-56">
              <select
                v-model="selectedHotelFilter"
                class="w-full h-10 px-3 bg-slate-50/50 border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="all">ทุกโรงแรม ({{ myHotels.length }} แห่ง)</option>
                <option v-for="h in myHotels" :key="h.id" :value="h.id">
                  {{ h.name }} ({{ getStatusCounts(h.id).total }} รายการ)
                </option>
              </select>
            </div>

            <!-- Status Filter -->
            <div class="sm:w-44">
              <select
                v-model="selectedStatusFilter"
                class="w-full h-10 px-3 bg-slate-50/50 border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="confirmed">รอเช็คอิน (Confirmed)</option>
                <option value="checked_in">เข้าพักอยู่ (Checked-in)</option>
                <option value="completed">เสร็จสิ้น (Checked-out)</option>
              </select>
            </div>
          </div>

          <!-- Empty Hotels Toggle -->
          <div v-if="selectedHotelFilter === 'all' && myHotels.length > 1" class="flex items-center gap-2 self-start sm:self-auto text-xs text-ink-muted">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="onlyWithBookings"
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>แสดงเฉพาะโรงแรมที่มีรายการจอง</span>
            </label>
          </div>
        </div>

        <!-- No Hotels Belong to Manager -->
        <div v-if="!myHotels.length" class="bg-white rounded-2xl border border-line p-12 text-center shadow-2xs">
          <Hotel class="w-12 h-12 text-slate-300 mx-auto mb-3" :stroke-width="1.5" />
          <h3 class="text-base font-semibold text-ink mb-1">ยังไม่มีโรงแรมในการดูแลของคุณ</h3>
          <p class="text-sm text-ink-muted">เมื่อคุณมีโรงแรมที่ได้รับการอนุมัติ รายการผู้เข้าพักจะแสดงที่นี่</p>
        </div>

        <!-- No Hotel Match Filter -->
        <div v-else-if="!displayedHotels.length" class="bg-white rounded-2xl border border-line p-12 text-center shadow-2xs">
          <Filter class="w-10 h-10 text-slate-300 mx-auto mb-3" :stroke-width="1.5" />
          <h3 class="text-base font-semibold text-ink mb-1">ไม่พบโรงแรมหรือรายการจองที่ตรงกับเงื่อนไข</h3>
          <p class="text-sm text-ink-muted mb-4">ลองล้างการค้นหาหรือปรับเงื่อนไขตัวกรองใหม่</p>
          <div class="flex items-center justify-center gap-3">
            <button
              @click="searchQuery = ''; selectedHotelFilter = 'all'; selectedStatusFilter = 'all'; onlyWithBookings = false"
              class="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              รีเซ็ตตัวกรองทั้งหมด
            </button>
          </div>
        </div>

        <!-- Separate Tables for Each Hotel -->
        <div v-else class="space-y-8">
          <div
            v-for="hotel in displayedHotels"
            :key="hotel.id"
            class="bg-white rounded-2xl border border-line overflow-hidden shadow-2xs transition-shadow hover:shadow-sm"
          >
            <!-- Hotel Table Header -->
            <div class="px-5 py-4 bg-slate-50/80 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex items-start md:items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 md:mt-0">
                  <Hotel class="w-5 h-5" :stroke-width="1.75" />
                </div>
                <div>
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <h2 class="font-display font-semibold text-base md:text-lg text-ink">
                      {{ hotel.name }}
                    </h2>
                    <span class="text-xs px-2.5 py-0.5 rounded-full font-medium bg-white border border-line text-ink-muted">
                      {{ getFilteredBookingsForHotel(hotel.id).length }} รายการ
                    </span>
                  </div>
                  <p class="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                    <MapPin class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ hotel.location || 'ไม่ระบุทำเล' }}</span>
                  </p>
                </div>
              </div>

              <!-- Quick Status Counters for this Hotel -->
              <div class="flex items-center gap-2 flex-wrap text-xs">
                <span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                  รอ Check-in: {{ getStatusCounts(hotel.id).waiting }}
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium">
                  กำลังพัก: {{ getStatusCounts(hotel.id).checkedIn }}
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                  เช็คเอาท์แล้ว: {{ getStatusCounts(hotel.id).completed }}
                </span>
              </div>
            </div>

            <!-- Hotel Guest Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-canvas border-b border-line">
                  <tr>
                    <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">ลูกค้า</th>
                    <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">ห้องพัก / ผู้เข้าพัก</th>
                    <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">วันที่เช็คอิน – เช็คเอาท์</th>
                    <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">สถานะ</th>
                    <th class="text-left py-3.5 px-4 text-xs font-semibold text-ink-muted">การดำเนินการ (Actions)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <!-- Empty State in Hotel Table -->
                  <tr v-if="!getFilteredBookingsForHotel(hotel.id).length">
                    <td colspan="5" class="py-8 text-center text-ink-muted text-sm">
                      ไม่มีรายการจองลูกค้าสำหรับโรงแรมนี้
                    </td>
                  </tr>

                  <!-- Paginated Rows (Max 10 per page) -->
                  <tr
                    v-for="b in getPaginatedBookingsForHotel(hotel.id)"
                    :key="b.id"
                    class="hover:bg-slate-50/70 transition-colors"
                  >
                    <!-- Customer Column -->
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
                          {{ getUserName(b.userId).charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="font-medium text-ink leading-snug">{{ getUserName(b.userId) }}</p>
                          <p class="text-xs text-ink-muted">รหัสจอง: {{ b.id }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Room & Guests Column -->
                    <td class="py-3 px-4">
                      <div class="flex items-start gap-2">
                        <BedDouble class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p class="font-medium text-ink">
                            {{ b.roomNo ? `ห้อง ${b.roomNo}` : 'ยังไม่ระบุเลขห้อง' }}
                          </p>
                          <p class="text-xs text-ink-muted">
                            <span v-if="getRoomName(hotel, b.roomId)">{{ getRoomName(hotel, b.roomId) }} · </span>
                            <span>{{ b.guests }} ท่าน</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <!-- Dates Column -->
                    <td class="py-3 px-4">
                      <p class="text-ink font-medium leading-snug">
                        {{ formatDate(b.checkIn) }} – {{ formatDate(b.checkOut) }}
                      </p>
                      <p class="text-xs text-ink-muted">
                        {{ b.nights }} คืน
                      </p>
                    </td>

                    <!-- Status Column -->
                    <td class="py-3 px-4">
                      <StatusBadge entity="booking" :value="derivedStatus(b)" size="sm" />
                    </td>

                    <!-- Actions Column (Text Arrow Down / Dropdown Select) -->
                    <td class="py-3 px-4">
                      <div class="relative inline-flex items-center">
                        <select
                          :value="getBookingAction(b)"
                          @change="handleActionSelect(b, $event)"
                          :class="[
                            'appearance-none h-8.5 pl-3 pr-8 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                            getActionBadgeClass(b)
                          ]"
                          aria-label="เลือกการดำเนินการ"
                        >
                          <option value="waiting" class="bg-white text-ink font-normal">รอ Check-in</option>
                          <option value="check_in" class="bg-white text-ink font-normal">Check-in (เข้าพัก)</option>
                          <option value="check_out" class="bg-white text-ink font-normal">Check-out (เสร็จสิ้น)</option>
                        </select>
                        <ChevronDown class="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-slate-500" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer for this Hotel (> 10 items) -->
            <div
              v-if="getFilteredBookingsForHotel(hotel.id).length > pageSize"
              class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-line"
            >
              <p class="text-xs text-ink-muted">
                แสดง
                <strong>{{ ((getCurrentPage(hotel.id) - 1) * pageSize) + 1 }}</strong> -
                <strong>{{ Math.min(getCurrentPage(hotel.id) * pageSize, getFilteredBookingsForHotel(hotel.id).length) }}</strong>
                จากทั้งหมด
                <strong>{{ getFilteredBookingsForHotel(hotel.id).length }}</strong> รายการ
              </p>

              <div class="flex items-center gap-1.5">
                <!-- Previous Page Button -->
                <button
                  @click="setHotelPage(hotel.id, getCurrentPage(hotel.id) - 1)"
                  :disabled="getCurrentPage(hotel.id) === 1"
                  class="p-1.5 rounded-lg border border-line bg-white text-ink-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="หน้าก่อนหน้า"
                  aria-label="หน้าก่อนหน้า"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>

                <!-- Page Numbers -->
                <button
                  v-for="p in getVisiblePages(hotel.id)"
                  :key="p"
                  @click="setHotelPage(hotel.id, p)"
                  :class="[
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    getCurrentPage(hotel.id) === p
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white border border-line text-slate-600 hover:bg-slate-100'
                  ]"
                >
                  {{ p }}
                </button>

                <!-- Next Page Button -->
                <button
                  @click="setHotelPage(hotel.id, getCurrentPage(hotel.id) + 1)"
                  :disabled="getCurrentPage(hotel.id) >= getTotalPages(hotel.id)"
                  class="p-1.5 rounded-lg border border-line bg-white text-ink-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="หน้าถัดไป"
                  aria-label="หน้าถัดไป"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
