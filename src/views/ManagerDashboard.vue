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
import { LayoutDashboard, Hotel, Users, MessageCircle, TrendingUp, DollarSign, Calendar, Edit3, Archive, Plus } from '@lucide/vue'

const { session } = useSession()

const myHotels = computed(() => (db['adoga_hotels'] || []).filter(h => h.managerId === session.value?.userId))
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

// Refund modal
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
const hotelForm = ref({
  name: '',
  location: '',
  description: '',
  pricePerNight: 1200,
  discount: 0,
  imageUrl: '',
  amenities: ['WiFi ฟรี', 'ที่จอดรถ', 'อาหารเช้า']
})

const ALL_AMENITIES = ['WiFi ฟรี', 'สระว่ายน้ำ', 'อาหารเช้า', 'ที่จอดรถ', 'ฟิตเนส', 'สปา', 'ร้านอาหาร', 'หาดส่วนตัว']

function openAddHotel() {
  editingHotelId.value = null
  hotelForm.value = {
    name: '',
    location: 'บางแสน, ชลบุรี',
    description: '',
    pricePerNight: 1200,
    discount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    amenities: ['WiFi ฟรี', 'ที่จอดรถ', 'อาหารเช้า']
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
  hotelForm.value = {
    name: hotel.name,
    location: hotel.location,
    description: hotel.description || '',
    pricePerNight: hotel.pricePerNight,
    discount: hotel.discount || 0,
    imageUrl: hotel.images?.[0] || '',
    amenities: [...(hotel.amenities || [])]
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

  const payload = {
    managerId: session.value.userId,
    name: hotelForm.value.name,
    location: hotelForm.value.location,
    description: hotelForm.value.description,
    pricePerNight: Number(hotelForm.value.pricePerNight),
    discount: Number(hotelForm.value.discount),
    amenities: hotelForm.value.amenities,
    images: hotelForm.value.imageUrl ? [hotelForm.value.imageUrl] : []
  }

  if (editingHotelId.value) {
    updateHotel(editingHotelId.value, payload)
    showToast('ส่งการแก้ไขข้อมูลโรงแรมแล้ว (สถานะ: รออนุมัติ)', 'success')
  } else {
    createHotel(payload)
    showToast('เพิ่มโรงแรมเรียบร้อยแล้ว (สถานะ: รออนุมัติ)', 'success')
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
</script>

<template>
  <div class="min-h-screen bg-canvas flex">
    <!-- Sidebar -->
    <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-line py-6 px-4 sticky top-0 h-screen overflow-y-auto">
      <div class="flex items-center gap-2 mb-8 px-2">
        <div class="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Hotel class="w-5 h-5 text-white" :stroke-width="2" />
        </div>
        <div>
          <p class="font-display font-semibold text-sm text-ink">Adoga Manager</p>
          <p class="text-xs text-ink-muted">Partner Portal</p>
        </div>
      </div>
      <nav class="flex flex-col gap-1">
        <RouterLink to="/manager" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50">
          <LayoutDashboard class="w-5 h-5" :stroke-width="1.75" /> ภาพรวม & แดชบอร์ด
        </RouterLink>
        <RouterLink to="/manager/guests" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100 transition-colors">
          <Users class="w-5 h-5" :stroke-width="1.75" /> จัดการแขก
        </RouterLink>
        <RouterLink to="/manager/messages" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100 transition-colors">
          <MessageCircle class="w-5 h-5" :stroke-width="1.75" /> ข้อความ
        </RouterLink>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 overflow-auto">
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
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-semibold text-xl text-ink">โรงแรมของฉัน</h2>
            <span class="text-sm text-ink-muted">{{ myHotels.length }} แห่ง</span>
          </div>

          <div v-if="!myHotels.length" class="py-12 text-center bg-white rounded-2xl border border-line">
            <Hotel class="w-12 h-12 text-slate-300 mx-auto mb-3" :stroke-width="1.5" />
            <p class="text-ink font-medium">ยังไม่มีโรงแรม</p>
            <p class="text-sm text-ink-muted mb-4">เพิ่มโรงแรมแรกของคุณเพื่อเปิดรับการจอง</p>
            <BaseButton @click="openAddHotel" variant="secondary" size="md">เพิ่มโรงแรม</BaseButton>
          </div>

          <div v-else class="flex flex-col gap-6">
            <div v-for="hotel in myHotels" :key="hotel.id" class="bg-white rounded-2xl border border-line p-4 md:p-6 shadow-e1">
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
                    <div class="flex gap-2">
                      <BaseButton v-if="r.status === 'submitted'" @click="doStartReview(r.id)" variant="outline" size="sm">ตรวจสอบ</BaseButton>
                      <BaseButton v-if="r.status === 'reviewing'" @click="doApprove(r.id)" variant="secondary" size="sm">อนุมัติ</BaseButton>
                      <BaseButton v-if="r.status === 'reviewing'" @click="openReject(r.id)" variant="danger" size="sm">ปฏิเสธ</BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

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

    <!-- Hotel Add/Edit Modal -->
    <BaseModal :open="showHotelModal" @close="showHotelModal = false" :title="editingHotelId ? 'แก้ไขข้อมูลโรงแรม' : 'เพิ่มโรงแรมใหม่'">
      <form @submit.prevent="saveHotelForm" class="flex flex-col gap-4">
        <BaseInput label="ชื่อโรงแรม *" v-model="hotelForm.name" placeholder="เช่น แกรนด์ บีช รีสอร์ท บางแสน" required />
        <BaseInput label="ทำเลที่ตั้ง *" v-model="hotelForm.location" placeholder="เช่น หาดบางแสน, ชลบุรี" required />
        <div class="grid grid-cols-2 gap-3">
          <BaseInput label="ราคาเริ่มต้น/คืน (฿) *" type="number" v-model="hotelForm.pricePerNight" placeholder="1500" required />
          <BaseInput label="ส่วนลด (%)" type="number" v-model="hotelForm.discount" placeholder="0" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink mb-1.5">รูปภาพ (URL)</label>
          <input v-model="hotelForm.imageUrl" placeholder="https://..." class="w-full h-11 px-4 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-indigo-600" />
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
        <div class="flex gap-3 justify-end mt-2">
          <BaseButton type="button" @click="showHotelModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
          <BaseButton type="submit" variant="secondary" size="md">บันทึกและส่งตรวจสอบ</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
