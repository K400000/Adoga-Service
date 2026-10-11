<script setup>
// src/views/ManagerDashboard.vue
import { computed, ref } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import {
  approveRefund, rejectRefund, startReview,
  suspendHotel, activateHotel, closeHotel,
  setUnitMaintenance, setUnitAvailable,
  createHotel, updateHotel
} from '../services/transitions.js'
import { formatPrice, formatDate } from '../utils/date.js'
import { showToast } from '../utils/toast.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import StatusBanner from '../components/common/StatusBanner.vue'
import BaseModal from '../components/common/BaseModal.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseInput from '../components/common/BaseInput.vue'
import { RouterLink } from 'vue-router'
import { LayoutDashboard, Hotel, Users, MessageCircle, TrendingUp, DollarSign, Calendar, Edit3, Archive, Plus, FileText, Search, BedDouble, Trash2 } from '@lucide/vue'

const { session } = useSession()

const myHotels = computed(() => (db['adoga_hotels'] || []).filter(h => h.managerId === session.value?.userId))
const searchQuery = ref('')

const filteredHotels = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return myHotels.value
  return myHotels.value.filter(h =>
    h.name.toLowerCase().includes(query) ||
    (h.location && h.location.toLowerCase().includes(query))
  )
})

const allBookings = computed(() => db['adoga_bookings'] || [])
const allRefunds = computed(() => db['adoga_refunds'] || [])

const myHotelIds = computed(() => myHotels.value.map(h => h.id))

const revenue = computed(() => {
  return allBookings.value
    .filter(b => myHotelIds.value.includes(b.hotelId) && ['confirmed','completed'].includes(b.status))
    .reduce((s, b) => s + b.totalPrice, 0)
})

const bookingsCount = computed(() => allBookings.value.filter(b => myHotelIds.value.includes(b.hotelId)).length)
const myRefunds = computed(() => allRefunds.value.filter(r => myHotelIds.value.includes(r.hotelId)))

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

// Refund Reject modal
const showRejectModal = ref(false)
const rejectId = ref('')
const rejectReason = ref('')

function doStartReview(id) {
  startReview(id)
  showToast('เริ่มการตรวจสอบคำขอคืนเงินแล้ว', 'info')
}
function doApprove(id) {
  approveRefund(id)
  showToast('อนุมัติการคืนเงินเรียบร้อยแล้ว', 'success')
}
function openReject(id) {
  rejectId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}
function doReject() {
  rejectRefund(rejectId.value, rejectReason.value)
  showRejectModal.value = false
  showToast('ปฏิเสธคำขอคืนเงินแล้ว', 'info')
}

// Hotel Form Modal
const showHotelModal = ref(false)
const editingHotelId = ref(null)
const newImageUrl = ref('')

const hotelForm = ref({
  name: '',
  location: '',
  description: '',
  pricePerNight: 1200,
  discount: 0,
  images: [],
  amenities: ['WiFi ฟรี', 'ที่จอดรถ', 'อาหารเช้า']
})

const ALL_AMENITIES = ['WiFi ฟรี', 'สระว่ายน้ำ', 'อาหารเช้า', 'ที่จอดรถ', 'ฟิตเนส', 'สปา', 'ร้านอาหาร', 'หาดส่วนตัว']

function addImageLink() {
  const url = newImageUrl.value.trim()
  if (!url) return
  hotelForm.value.images.push(url)
  newImageUrl.value = ''
}

function removeImageLink(index) {
  hotelForm.value.images.splice(index, 1)
}

const activeModalTab = ref('general') // 'general' | 'rooms'
const isEditingRoom = ref(false)
const editingRoomIndex = ref(-1)
const roomForm = ref({
  type: '',
  price: 1500,
  capacity: 2,
  unitNumbers: ''
})

const totalUnitsCount = computed(() => {
  if (!hotelForm.value?.rooms) return 0
  return hotelForm.value.rooms.reduce((sum, r) => sum + (r.units?.length || 0), 0)
})

function openAddRoom() {
  editingRoomIndex.value = -1
  roomForm.value = {
    type: '',
    price: Number(hotelForm.value.pricePerNight) || 1500,
    capacity: 2,
    unitNumbers: '101, 102'
  }
  isEditingRoom.value = true
}

function openEditRoom(room, index) {
  editingRoomIndex.value = index
  roomForm.value = {
    type: room.type,
    price: room.price,
    capacity: room.capacity,
    unitNumbers: room.units ? room.units.map(u => u.no).join(', ') : ''
  }
  isEditingRoom.value = true
}

function saveRoomForm() {
  if (!roomForm.value.type.trim()) {
    showToast('กรุณาระบุชื่อประเภทห้องพัก', 'error')
    return
  }
  if (roomForm.value.price <= 0) {
    showToast('กรุณาระบุราคาห้องพักที่ถูกต้อง', 'error')
    return
  }

  const rawUnits = (roomForm.value.unitNumbers || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  
  const unitNos = [...new Set(rawUnits)]
  if (!unitNos.length) {
    unitNos.push('101')
  }

  if (editingRoomIndex.value >= 0) {
    const existingRoom = hotelForm.value.rooms[editingRoomIndex.value]
    const existingUnitsMap = new Map((existingRoom.units || []).map(u => [u.no, u]))
    
    const updatedUnits = unitNos.map(no => {
      if (existingUnitsMap.has(no)) {
        return existingUnitsMap.get(no)
      }
      return { no, status: 'available', statusHistory: [] }
    })

    existingRoom.type = roomForm.value.type.trim()
    existingRoom.price = Number(roomForm.value.price)
    existingRoom.capacity = Number(roomForm.value.capacity)
    existingRoom.units = updatedUnits
    showToast('อัปเดตประเภทห้องพักแล้ว', 'success')
  } else {
    const newRoom = {
      id: 'R' + Date.now(),
      type: roomForm.value.type.trim(),
      price: Number(roomForm.value.price),
      capacity: Number(roomForm.value.capacity),
      units: unitNos.map(no => ({ no, status: 'available', statusHistory: [] }))
    }
    if (!hotelForm.value.rooms) hotelForm.value.rooms = []
    hotelForm.value.rooms.push(newRoom)
    showToast('เพิ่มประเภทห้องพักเรียบร้อย', 'success')
  }
  isEditingRoom.value = false
}

function removeRoomType(index) {
  if (hotelForm.value.rooms.length <= 1) {
    showToast('โรงแรมต้องมีประเภทห้องพักอย่างน้อย 1 ประเภท', 'error')
    return
  }
  if (confirm('ยืนยันที่จะลบประเภทห้องพักนี้หรือไม่?')) {
    hotelForm.value.rooms.splice(index, 1)
    showToast('ลบประเภทห้องพักเรียบร้อย', 'info')
  }
}

function toggleUnitStatus(room, unit) {
  if (unit.status === 'booked') {
    showToast('ห้องพักนี้มีผู้จองอยู่ ไม่สามารถเปลี่ยนสถานะได้', 'info')
    return
  }
  unit.status = unit.status === 'available' ? 'maintenance' : 'available'
}

function addQuickUnit(room) {
  const nextNo = prompt('ระบุหมายเลขห้องใหม่ (เช่น 103):')
  if (!nextNo || !nextNo.trim()) return
  const cleanNo = nextNo.trim()
  if (room.units.some(u => u.no === cleanNo)) {
    showToast('หมายเลขห้องนี้มีอยู่แล้ว', 'error')
    return
  }
  room.units.push({ no: cleanNo, status: 'available', statusHistory: [] })
  showToast(`เพิ่มห้อง #${cleanNo} เรียบร้อย`, 'success')
}

function removeUnit(room, unitIndex) {
  if (room.units.length <= 1) {
    showToast('ประเภทห้องต้องมีห้องพักอย่างน้อย 1 ห้อง', 'error')
    return
  }
  const u = room.units[unitIndex]
  if (u.status === 'booked') {
    showToast('ห้องพักนี้มีผู้จองอยู่ ไม่สามารถลบได้', 'error')
    return
  }
  room.units.splice(unitIndex, 1)
}

function openAddHotel() {
  editingHotelId.value = null
  newImageUrl.value = ''
  activeModalTab.value = 'general'
  isEditingRoom.value = false
  hotelForm.value = {
    name: '',
    location: 'บางแสน, ชลบุรี',
    description: '',
    pricePerNight: 1200,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    amenities: ['WiFi ฟรี', 'ที่จอดรถ', 'อาหารเช้า'],
    rooms: [
      {
        id: 'R' + Date.now(),
        type: 'Standard Room',
        price: 1200,
        capacity: 2,
        units: [
          { no: '101', status: 'available' },
          { no: '102', status: 'available' }
        ]
      }
    ]
  }
  showHotelModal.value = true
}

function openEditHotel(hotel) {
  if (hotel.status === 'approved') {
    if (!confirm('คำเตือน: การแก้ไขข้อมูลจะทำให้โรงแรมกลับไปสู่สถานะ "รออนุมัติ" (pending) และหยุดแสดงในหน้าค้นหาชั่วคราว ยืนยันการแก้ไขหรือไม่?')) {
      return
    }
  }
  editingHotelId.value = hotel.id
  newImageUrl.value = ''
  activeModalTab.value = 'general'
  isEditingRoom.value = false
  hotelForm.value = {
    name: hotel.name,
    location: hotel.location,
    description: hotel.description || '',
    pricePerNight: hotel.pricePerNight,
    discount: hotel.discount || 0,
    images: hotel.images && hotel.images.length ? [...hotel.images] : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    amenities: [...(hotel.amenities || [])],
    rooms: hotel.rooms && hotel.rooms.length
      ? JSON.parse(JSON.stringify(hotel.rooms))
      : [
          {
            id: 'R' + Date.now(),
            type: 'Standard Room',
            price: hotel.pricePerNight || 1200,
            capacity: 2,
            units: [
              { no: '101', status: 'available' },
              { no: '102', status: 'available' }
            ]
          }
        ]
  }
  showHotelModal.value = true
}

function toggleAmenity(amenity) {
  if (hotelForm.value.amenities.includes(amenity)) {
    hotelForm.value.amenities = hotelForm.value.amenities.filter(a => a !== amenity)
  } else {
    hotelForm.value.amenities.push(amenity)
  }
}

function saveHotelForm() {
  if (!hotelForm.value.name.trim() || !hotelForm.value.location.trim()) {
    showToast('กรุณากรอกชื่อและทำเลที่ตั้ง', 'error')
    return
  }

  if (newImageUrl.value.trim()) {
    hotelForm.value.images.push(newImageUrl.value.trim())
    newImageUrl.value = ''
  }

  const payload = {
    managerId: session.value.userId,
    name: hotelForm.value.name,
    location: hotelForm.value.location,
    description: hotelForm.value.description,
    pricePerNight: Number(hotelForm.value.pricePerNight),
    discount: Number(hotelForm.value.discount),
    amenities: hotelForm.value.amenities,
    images: hotelForm.value.images.length ? hotelForm.value.images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    rooms: hotelForm.value.rooms && hotelForm.value.rooms.length ? hotelForm.value.rooms : [
      {
        id: 'R' + Date.now(),
        type: 'Standard Room',
        price: Number(hotelForm.value.pricePerNight) || 1200,
        capacity: 2,
        units: [
          { no: '101', status: 'available' },
          { no: '102', status: 'available' }
        ]
      }
    ]
  }

  if (editingHotelId.value) {
    updateHotel(editingHotelId.value, payload)
    showToast('ส่งการแก้ไขข้อมูลโรงแรมและห้องพักแล้ว (สถานะ: รออนุมัติ)', 'success')
  } else {
    createHotel(payload)
    showToast('เพิ่มโรงแรมและห้องพักเรียบร้อยแล้ว (สถานะ: รออนุมัติ)', 'success')
  }
  showHotelModal.value = false
}

function doCloseHotel(hotelId) {
  if (confirm('ยืนยันการปิดกิจการโรงแรมนี้ถาวรหรือไม่?')) {
    closeHotel(hotelId)
    showToast('ปิดกิจการโรงแรมเรียบร้อยแล้ว', 'info')
  }
}

function doSuspend(hotelId) {
  suspendHotel(hotelId)
  showToast('ปิดรับจองชั่วคราวแล้ว', 'info')
}

function doActivate(hotelId) {
  activateHotel(hotelId)
  showToast('เปิดรับจองโรงแรมแล้ว', 'success')
}

const stats = computed(() => [
  { label: 'รายได้รวม', value: formatPrice(revenue.value), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'การจองทั้งหมด', value: bookingsCount.value, icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'โรงแรมของฉัน', value: myHotels.value.length, icon: Hotel, color: 'text-amber-600 bg-amber-50' },
  { label: 'ใบขอคืนเงิน', value: myRefunds.value.length, icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
])

const hotelStatusDesc = {
  pending: 'รอผู้ดูแลระบบอนุมัติ',
  approved: 'กำลังเปิดรับจอง',
  rejected: (h) => h.rejectReason ? `ถูกปฏิเสธ: ${h.rejectReason}` : 'ถูกปฏิเสธ (กรุณาแก้ไขเพื่อส่งตรวจใหม่)',
  suspended: 'หยุดรับจองชั่วคราว',
  closed: 'ปิดกิจการแล้ว',
}
import Sidebar from '../components/common/Sidebar.vue'
import HelpFloatingButton from '../components/common/HelpFloatingButton.vue'
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <!-- Sidebar -->
    <Sidebar type="manager" />

    <!-- Main content -->
    <div class="flex-1 min-w-0 lg:ml-64 overflow-auto">
      <div class="mx-auto max-w-[1200px] px-4 md:px-8 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="font-display font-semibold text-2xl text-ink">ภาพรวม & แดชบอร์ด</h1>
          <BaseButton @click="openAddHotel" variant="primary" size="md">
            <Plus class="w-4 h-4 mr-1" /> เพิ่มโรงแรม
          </BaseButton>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl border border-line p-4 md:p-6">
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.color]">
              <component :is="stat.icon" class="w-5 h-5" :stroke-width="1.75" />
            </div>
            <p class="text-2xl font-display font-semibold text-ink tabular-nums">{{ stat.value }}</p>
            <p class="text-sm text-ink-muted mt-1">{{ stat.label }}</p>
          </div>
        </div>

        <!-- Hotels -->
        <section class="mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div class="flex items-center gap-3">
              <h2 class="font-display font-semibold text-xl text-ink">โรงแรมของฉัน</h2>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {{ filteredHotels.length }} / {{ myHotels.length }} แห่ง
              </span>
            </div>

            <!-- Search input -->
            <div v-if="myHotels.length" class="relative w-full sm:w-72">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาชื่อโรงแรมหรือทำเล..."
                class="w-full h-10 pl-9 pr-8 bg-white border border-line rounded-xl text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs"
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

          <div v-if="!myHotels.length" class="py-12 text-center bg-white rounded-2xl border border-line">
            <Hotel class="w-12 h-12 text-slate-300 mx-auto mb-3" :stroke-width="1.5" />
            <p class="text-ink font-medium">ยังไม่มีโรงแรม</p>
            <p class="text-sm text-ink-muted mb-4">เพิ่มโรงแรมแรกของคุณเพื่อเปิดรับการจอง</p>
            <BaseButton @click="openAddHotel" variant="secondary" size="md">เพิ่มโรงแรม</BaseButton>
          </div>

          <div v-else-if="!filteredHotels.length" class="py-12 text-center bg-white rounded-2xl border border-line">
            <Hotel class="w-10 h-10 text-slate-300 mx-auto mb-2" :stroke-width="1.5" />
            <p class="text-ink font-medium text-sm">ไม่พบโรงแรมที่ตรงกับ "{{ searchQuery }}"</p>
            <button @click="searchQuery = ''" class="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
              ล้างคำค้นหา
            </button>
          </div>

          <div v-else class="flex flex-col gap-6">
            <div v-for="hotel in filteredHotels" :key="hotel.id" class="bg-white rounded-2xl border border-line p-4 md:p-6 shadow-e1">
              <StatusBanner
                :entity="'hotel'"
                :value="hotel.status"
                :title="hotel.name"
                :description="typeof hotelStatusDesc[hotel.status] === 'function' ? hotelStatusDesc[hotel.status](hotel) : hotelStatusDesc[hotel.status]"
              >
                <template #actions>
                  <div class="flex flex-wrap gap-2 mt-3 sm:mt-0">
                    <BaseButton
                      v-if="['approved', 'rejected'].includes(hotel.status)"
                      @click="openEditHotel(hotel)"
                      variant="outline"
                      size="sm"
                    >
                      <Edit3 class="w-3.5 h-3.5 mr-1" /> แก้ไขข้อมูล
                    </BaseButton>
                    <BaseButton
                      v-if="hotel.status === 'approved'"
                      @click="doSuspend(hotel.id)"
                      variant="outline"
                      size="sm"
                    >ปิดชั่วคราว</BaseButton>
                    <BaseButton
                      v-if="hotel.status === 'suspended'"
                      @click="doActivate(hotel.id)"
                      variant="secondary"
                      size="sm"
                    >เปิดใช้งาน</BaseButton>
                    <BaseButton
                      v-if="hotel.status === 'approved'"
                      @click="doCloseHotel(hotel.id)"
                      variant="danger"
                      size="sm"
                    >
                      <Archive class="w-3.5 h-3.5 mr-1" /> ปิดกิจการ
                    </BaseButton>
                  </div>
                </template>
              </StatusBanner>

              <!-- Manager Hotel Image Gallery Preview -->
              <div v-if="hotel.images && hotel.images.length" class="mt-4 pt-4 border-t border-line/60">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    🖼️ รูปภาพโรงแรม ({{ hotel.images.length }} รูป)
                  </span>
                  <span class="text-[11px] text-slate-400 font-medium">กด "แก้ไขข้อมูล" เพื่อเพิ่ม/ลบลิงก์รูปภาพ</span>
                </div>
                <div class="flex gap-3 overflow-x-auto pb-2">
                  <div
                    v-for="(img, idx) in hotel.images"
                    :key="idx"
                    class="w-32 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100 relative group shadow-xs"
                  >
                    <img
                      :src="img"
                      :alt="hotel.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      @error="$event.target.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'"
                    />
                    <span class="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                      #{{ idx + 1 }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Rooms table -->
              <div class="mt-4">
                <h4 class="font-medium text-sm text-ink mb-2">รายการห้องพัก</h4>
                <div class="overflow-x-auto rounded-xl border border-line">
                  <table class="w-full text-sm">
                    <thead class="bg-canvas">
                      <tr class="border-b border-line">
                        <th class="text-left py-2.5 px-4 text-xs font-medium text-ink-muted">ประเภทห้อง</th>
                        <th class="text-left py-2.5 px-4 text-xs font-medium text-ink-muted">หมายเลขห้อง</th>
                        <th class="text-left py-2.5 px-4 text-xs font-medium text-ink-muted">สถานะ</th>
                        <th class="text-left py-2.5 px-4 text-xs font-medium text-ink-muted">การจัดการห้อง</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="room in hotel.rooms" :key="room.id">
                        <tr v-for="unit in room.units" :key="unit.no" class="border-b border-line/50 hover:bg-slate-50">
                          <td class="py-3 px-4 text-ink font-medium">{{ room.type }}</td>
                          <td class="py-3 px-4 text-ink-muted">ห้อง {{ unit.no }}</td>
                          <td class="py-3 px-4">
                            <StatusBadge entity="room" :value="unit.status" size="sm" />
                          </td>
                          <td class="py-3 px-4">
                            <div class="flex gap-2">
                              <BaseButton
                                v-if="unit.status === 'available'"
                                @click="setUnitMaintenance(hotel.id, room.id, unit.no)"
                                variant="outline" size="sm"
                              >ปิดปรับปรุง</BaseButton>
                              <BaseButton
                                v-if="unit.status === 'maintenance'"
                                @click="setUnitAvailable(hotel.id, room.id, unit.no)"
                                variant="secondary" size="sm"
                              >เปิดพร้อมใช้งาน</BaseButton>
                              <span v-if="unit.status === 'booked'" class="text-xs text-indigo-600 font-medium py-1">
                                มีผู้เข้าพัก/จองแล้ว
                              </span>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Refunds -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-semibold text-xl text-ink">ใบขอคืนเงิน</h2>
            <span class="text-sm text-ink-muted">{{ myRefunds.length }} รายการ</span>
          </div>
          <div class="bg-white rounded-2xl border border-line overflow-hidden shadow-e1">
            <table class="w-full text-sm">
              <thead class="bg-canvas">
                <tr>
                  <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">รหัส</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">ยอดคืน</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">เหตุผล</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">สถานะ</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!myRefunds.length">
                  <td colspan="5" class="py-8 text-center text-ink-muted">ไม่มีใบขอคืนเงิน</td>
                </tr>
                <tr v-for="r in myRefunds" :key="r.id" class="border-t border-line hover:bg-slate-50">
                  <td class="py-3 px-4 font-mono text-xs text-ink-muted">{{ r.id }}</td>
                  <td class="py-3 px-4 font-display font-semibold text-ink tabular-nums">{{ formatPrice(r.amount) }}</td>
                  <td class="py-3 px-4 text-ink max-w-xs truncate">{{ r.reason }}</td>
                  <td class="py-3 px-4"><StatusBadge entity="refund" :value="r.status" size="sm" /></td>
                  <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-2 items-center">
                      <BaseButton @click="openDetailModal(r)" variant="ghost" size="sm">
                        <FileText class="w-3.5 h-3.5 mr-1" /> อ่านรายละเอียด
                      </BaseButton>
                      <BaseButton v-if="r.status === 'submitted'" @click="doStartReview(r.id)" variant="outline" size="sm">ตรวจสอบ</BaseButton>
                      <BaseButton v-if="['submitted', 'reviewing'].includes(r.status)" @click="doApprove(r.id)" variant="secondary" size="sm">อนุมัติ</BaseButton>
                      <BaseButton v-if="['submitted', 'reviewing'].includes(r.status)" @click="openReject(r.id)" variant="danger" size="sm">ปฏิเสธ</BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
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
            <span class="text-ink-muted">รหัสการจอง:</span>
            <span class="font-mono font-semibold text-ink">{{ selectedRefund.bookingId }}</span>
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

    <!-- Reject modal -->
    <BaseModal :open="showRejectModal" @close="showRejectModal = false" title="ปฏิเสธการคืนเงิน">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-ink-muted">กรุณาระบุเหตุผลในการปฏิเสธคำขอคืนเงิน</p>
        <textarea v-model="rejectReason" rows="3" placeholder="ระบุเหตุผล..." class="w-full px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-indigo-600 resize-none" />
        <div class="flex gap-3 justify-end">
          <BaseButton @click="showRejectModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
          <BaseButton @click="doReject" variant="danger" size="md" :disabled="!rejectReason.trim()">ยืนยันปฏิเสธ</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Hotel Add/Edit Modal with Tab Navigation & Room Management -->
    <BaseModal
      :open="showHotelModal"
      @close="showHotelModal = false"
      :title="editingHotelId ? 'แก้ไขข้อมูลโรงแรม' : 'เพิ่มโรงแรมใหม่'"
      size="3xl"
    >
      <!-- Modal Tab Navigation Bar -->
      <div class="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6 flex-shrink-0">
        <button
          type="button"
          @click="activeModalTab = 'general'"
          :class="[
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
            activeModalTab === 'general'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          ]"
        >
          <Hotel class="w-4 h-4" />
          <span>ข้อมูลโรงแรมทั่วไป</span>
        </button>

        <button
          type="button"
          @click="activeModalTab = 'rooms'"
          :class="[
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
            activeModalTab === 'rooms'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          ]"
        >
          <BedDouble class="w-4 h-4" />
          <span>จัดการห้องพัก & จำนวนห้อง</span>
          <span
            :class="[
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeModalTab === 'rooms' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-700'
            ]"
          >
            {{ totalUnitsCount }} ห้อง
          </span>
        </button>
      </div>

      <form @submit.prevent="saveHotelForm">
        <!-- TAB 1: General Info -->
        <div v-show="activeModalTab === 'general'" class="flex flex-col gap-4">
          <BaseInput label="ชื่อโรงแรม *" v-model="hotelForm.name" placeholder="เช่น แกรนด์ บีช รีสอร์ท บางแสน" required />
          <BaseInput label="ทำเลที่ตั้ง *" v-model="hotelForm.location" placeholder="เช่น หาดบางแสน, ชลบุรี" required />
          <div class="grid grid-cols-2 gap-3">
            <BaseInput label="ราคาเริ่มต้น/คืน (฿) *" type="number" v-model="hotelForm.pricePerNight" placeholder="1500" required />
            <BaseInput label="ส่วนลด (%)" type="number" v-model="hotelForm.discount" placeholder="0" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink mb-1.5 flex items-center justify-between">
              <span>รูปภาพโรงแรม (URL Link)</span>
              <span class="text-xs text-ink-muted">จำนวน {{ hotelForm.images.length }} รูป</span>
            </label>
            
            <div class="flex gap-2 mb-3">
              <input
                v-model="newImageUrl"
                @keydown.enter.prevent="addImageLink"
                placeholder="วาง URL รูปภาพ (เช่น https://images.unsplash.com/...)"
                class="flex-1 h-11 px-4 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-indigo-600 font-mono text-xs"
              />
              <BaseButton type="button" @click="addImageLink" variant="secondary" size="sm" class="flex-shrink-0">
                <Plus class="w-4 h-4 mr-1" /> เพิ่มรูป
              </BaseButton>
            </div>

            <!-- Preview Grid -->
            <div v-if="hotelForm.images.length" class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-line">
              <div
                v-for="(img, idx) in hotelForm.images"
                :key="idx"
                class="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-xs"
              >
                <img
                  :src="img"
                  alt="Preview"
                  class="w-full h-full object-cover"
                  @error="$event.target.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'"
                />
                <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    @click="removeImageLink(idx)"
                    class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✕ ลบ
                  </button>
                </div>
                <span class="absolute bottom-1 left-1 bg-slate-900/70 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                  #{{ idx + 1 }}
                </span>
              </div>
            </div>
            <p v-else class="text-xs text-rose-500 font-medium">ยังไม่มีรูปภาพ กรุณาใส่อย่างน้อย 1 ลิงก์</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink mb-1.5">สิ่งอำนวยความสะดวก</label>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="amenity in ALL_AMENITIES"
                :key="amenity"
                class="flex items-center gap-2 text-xs p-2 rounded-lg border border-line cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  :checked="hotelForm.amenities.includes(amenity)"
                  @change="toggleAmenity(amenity)"
                  class="rounded text-indigo-600"
                />
                <span>{{ amenity }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink mb-1.5">คำอธิบาย</label>
            <textarea v-model="hotelForm.description" rows="3" placeholder="รายละเอียดที่พัก..." class="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-indigo-600 resize-none" />
          </div>
        </div>

        <!-- TAB 2: Room Management -->
        <div v-show="activeModalTab === 'rooms'" class="flex flex-col gap-5">
          <!-- Room Stats & Add Room Type Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div>
              <h4 class="font-semibold text-sm text-indigo-950 flex items-center gap-1.5">
                <BedDouble class="w-4 h-4 text-indigo-600" />
                <span>ภาพรวมห้องพักของโรงแรม</span>
              </h4>
              <p class="text-xs text-indigo-700/80 mt-0.5">
                มีทั้งหมด <strong>{{ hotelForm.rooms?.length || 0 }}</strong> ประเภทห้องพัก รวม <strong>{{ totalUnitsCount }}</strong> ห้อง
              </p>
            </div>
            <BaseButton
              v-if="!isEditingRoom"
              type="button"
              @click="openAddRoom"
              variant="secondary"
              size="sm"
              class="self-start sm:self-auto shadow-2xs"
            >
              <Plus class="w-4 h-4 mr-1" /> เพิ่มประเภทห้องพัก
            </BaseButton>
          </div>

          <!-- Inline Add/Edit Room Type Form -->
          <div v-if="isEditingRoom" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-line shadow-xs flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-line pb-2.5">
              <h5 class="font-semibold text-sm text-ink flex items-center gap-2">
                <Edit3 class="w-4 h-4 text-indigo-600" />
                <span>{{ editingRoomIndex >= 0 ? 'แก้ไขประเภทห้องพัก' : 'เพิ่มประเภทห้องพักใหม่' }}</span>
              </h5>
              <button
                type="button"
                @click="isEditingRoom = false"
                class="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ✕ ยกเลิก
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">ชื่อประเภทห้องพัก *</label>
                <input
                  v-model="roomForm.type"
                  type="text"
                  placeholder="เช่น Deluxe Sea View"
                  class="w-full h-10 px-3 rounded-xl border border-line bg-white text-sm text-ink focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">ราคาต่อคืน (฿) *</label>
                <input
                  v-model.number="roomForm.price"
                  type="number"
                  placeholder="1500"
                  class="w-full h-10 px-3 rounded-xl border border-line bg-white text-sm text-ink focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">ความจุผู้เข้าพัก (ท่าน) *</label>
                <input
                  v-model.number="roomForm.capacity"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="2"
                  class="w-full h-10 px-3 rounded-xl border border-line bg-white text-sm text-ink focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-ink mb-1">
                หมายเลขห้องพัก (คั่นด้วยเครื่องหมายจุลภาค , เช่น 101, 102, 103)
              </label>
              <input
                v-model="roomForm.unitNumbers"
                type="text"
                placeholder="เช่น 101, 102, 103, 104"
                class="w-full h-10 px-3 rounded-xl border border-line bg-white text-sm text-ink font-mono focus:outline-none focus:border-indigo-600"
              />
              <p class="text-[11px] text-ink-muted mt-1">
                ระบบจะสร้างห้องตามหมายเลขที่ระบุ สามารถเพิ่มหรือลดหมายเลขห้องได้
              </p>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <BaseButton type="button" @click="isEditingRoom = false" variant="ghost" size="sm">ยกเลิก</BaseButton>
              <BaseButton type="button" @click="saveRoomForm" variant="primary" size="sm">
                {{ editingRoomIndex >= 0 ? 'บันทึกการแก้ไขห้อง' : 'บันทึกประเภทห้องพัก' }}
              </BaseButton>
            </div>
          </div>

          <!-- Room Types Table -->
          <div class="rounded-2xl border border-line overflow-hidden shadow-2xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm border-collapse">
                <thead class="bg-slate-50 border-b border-line text-xs font-semibold text-ink-muted">
                  <tr>
                    <th class="py-3 px-4">ประเภทห้องพัก</th>
                    <th class="py-3 px-4">ราคา/คืน</th>
                    <th class="py-3 px-4">ความจุ</th>
                    <th class="py-3 px-4">หมายเลขห้อง (Units) & สถานะ</th>
                    <th class="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <tr v-if="!hotelForm.rooms?.length">
                    <td colspan="5" class="py-8 text-center text-slate-400 text-xs">
                      ยังไม่มีประเภทห้องพัก กรุณากดปุ่ม "เพิ่มประเภทห้องพัก" ด้านบน
                    </td>
                  </tr>
                  <tr
                    v-for="(room, rIdx) in hotelForm.rooms"
                    :key="room.id || rIdx"
                    class="hover:bg-slate-50/70 transition-colors"
                  >
                    <!-- Room Type Name -->
                    <td class="py-3.5 px-4 font-semibold text-ink">
                      <div class="flex items-center gap-2">
                        <BedDouble class="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <p class="leading-tight">{{ room.type }}</p>
                          <p class="text-[11px] text-slate-400 font-normal">รหัส: {{ room.id }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Price -->
                    <td class="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      {{ formatPrice(room.price) }}
                    </td>

                    <!-- Capacity -->
                    <td class="py-3.5 px-4 text-xs text-ink-muted whitespace-nowrap">
                      {{ room.capacity }} ท่าน
                    </td>

                    <!-- Units & Statuses -->
                    <td class="py-3.5 px-4">
                      <div class="flex flex-wrap items-center gap-1.5 max-w-md">
                        <span
                          v-for="(u, uIdx) in room.units"
                          :key="u.no"
                          :class="[
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium border transition-colors select-none',
                            u.status === 'available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : u.status === 'booked'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          ]"
                          :title="u.status === 'available' ? 'คลิกเพื่อสลับเป็นปิดปรับปรุง' : u.status === 'maintenance' ? 'คลิกเพื่อสลับเป็นพร้อมใช้งาน' : 'ติดจอง'"
                        >
                          <span
                            @click="toggleUnitStatus(room, u)"
                            class="cursor-pointer hover:underline"
                          >
                            #{{ u.no }}
                          </span>
                          <span class="text-[9px] font-sans">
                            {{ u.status === 'available' ? 'ว่าง' : u.status === 'booked' ? 'ติดจอง' : 'ซ่อม' }}
                          </span>
                          <button
                            v-if="u.status !== 'booked'"
                            type="button"
                            @click.stop="removeUnit(room, uIdx)"
                            class="ml-0.5 text-slate-400 hover:text-rose-600 font-bold text-[10px] cursor-pointer"
                            title="ลบห้องนี้"
                          >
                            ✕
                          </button>
                        </span>

                        <!-- Quick Add Unit Button -->
                        <button
                          type="button"
                          @click="addQuickUnit(room)"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                          title="เพิ่มหมายเลขห้องในประเภทนี้"
                        >
                          <Plus class="w-3 h-3" /> เพิ่มห้อง
                        </button>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      <div class="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          @click="openEditRoom(room, rIdx)"
                          class="p-1.5 rounded-lg border border-line bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="แก้ไขรายละเอียดประเภทห้อง"
                        >
                          <Edit3 class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click="removeRoomType(rIdx)"
                          class="p-1.5 rounded-lg border border-line bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="ลบประเภทห้องพักนี้"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Sticky Footer Buttons with Tab Navigation and Save -->
        <div class="flex items-center justify-between pt-4 border-t border-line mt-6 sticky bottom-0 bg-white z-10 pb-1">
          <BaseButton type="button" @click="showHotelModal = false" variant="ghost" size="md">
            ยกเลิก
          </BaseButton>
          
          <div class="flex items-center gap-2">
            <BaseButton
              v-if="activeModalTab === 'general'"
              type="button"
              @click="activeModalTab = 'rooms'"
              variant="outline"
              size="md"
            >
              จัดการห้องพักต่อ →
            </BaseButton>

            <BaseButton
              v-if="activeModalTab === 'rooms'"
              type="button"
              @click="activeModalTab = 'general'"
              variant="outline"
              size="md"
            >
              ← ข้อมูลโรงแรม
            </BaseButton>

            <BaseButton type="submit" variant="secondary" size="md" class="shadow-2xs">
              บันทึกและส่งตรวจสอบ
            </BaseButton>
          </div>
        </div>
      </form>
    </BaseModal>
    <!-- Help Floating Button -->
    <HelpFloatingButton />
  </div>
</template>
