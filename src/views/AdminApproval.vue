<script setup>
// src/views/AdminApproval.vue
import { computed, ref } from 'vue'
import { db } from '../stores/db.js'
import { approveHotel, rejectHotel } from '../services/transitions.js'
import { formatPrice } from '../utils/date.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseModal from '../components/common/BaseModal.vue'
import { RouterLink } from 'vue-router'
import { CheckSquare, Settings, LayoutDashboard, Info } from '@lucide/vue'
import { FALLBACK_IMAGE } from '../constants/images.js'

const pendingHotels = computed(() => (db['adoga_hotels'] || []).filter(h => h.status === 'pending'))
const allHotels = computed(() => db['adoga_hotels'] || [])

const showRejectModal = ref(false)
const rejectHotelId = ref('')
const rejectReason = ref('')

const showInfoModal = ref(false)
const selectedHotel = ref(null)

function openInfoModal(hotel) {
  selectedHotel.value = hotel
  showInfoModal.value = true
}

function doApproveFromModal(id) {
  doApprove(id)
  showInfoModal.value = false
}

function openRejectFromModal(id) {
  showInfoModal.value = false
  openReject(id)
}

function doApprove(id) { approveHotel(id) }
function openReject(id) { rejectHotelId.value = id; rejectReason.value = ''; showRejectModal.value = true }
function doReject() { rejectHotel(rejectHotelId.value, rejectReason.value); showRejectModal.value = false }

function getManager(managerId) { return (db['adoga_users'] || []).find(u => u.id === managerId) }
import Sidebar from '../components/common/Sidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <Sidebar type="admin" />
    <div class="flex-1 min-w-0 lg:ml-64 px-4 md:px-8 py-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-2">อนุมัติโรงแรม</h1>
      <p class="text-sm text-ink-muted mb-8">โรงแรมที่รออนุมัติ {{ pendingHotels.length }} แห่ง</p>

      <div v-if="!pendingHotels.length" class="py-16 text-center bg-white rounded-2xl border border-line">
        <p class="text-lg font-medium text-ink mb-1">ไม่มีโรงแรมรออนุมัติ</p>
        <p class="text-sm text-ink-muted">โรงแรมทั้งหมดได้รับการตรวจสอบแล้ว</p>
      </div>

      <div class="flex flex-col gap-4">
        <div v-for="hotel in pendingHotels" :key="hotel.id" class="bg-white rounded-2xl border border-line overflow-hidden">
          <div class="flex flex-col md:flex-row gap-4 p-6">
            <img :src="hotel.images?.[0] || FALLBACK_IMAGE" :alt="hotel.name" class="w-full md:w-48 h-32 object-cover rounded-xl flex-shrink-0" loading="lazy" />
            <div class="flex-1">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-display font-semibold text-xl text-ink">{{ hotel.name }}</h3>
                <StatusBadge entity="hotel" value="pending" size="sm" />
              </div>
              <p class="text-sm text-ink-muted mb-1">📍 {{ hotel.location }}</p>
              <p class="text-sm text-ink-muted mb-3">ผู้จัดการ: {{ getManager(hotel.managerId)?.nickname || hotel.managerId }}</p>
              <p class="text-sm text-ink mb-4">{{ hotel.description }}</p>
              <div class="flex flex-wrap gap-2 mb-4">
                <span v-for="a in hotel.amenities" :key="a" class="text-xs px-2 py-1 rounded-full bg-slate-100 text-ink-muted">{{ a }}</span>
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
      </div>

      <!-- All hotels list -->
      <div class="mt-12">
        <h2 class="font-display font-semibold text-xl text-ink mb-4">โรงแรมทั้งหมด</h2>
        <div class="bg-white rounded-2xl border border-line overflow-hidden">
          <table class="w-full text-sm">
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
              <tr v-for="h in allHotels" :key="h.id" class="border-t border-line hover:bg-slate-50">
                <td class="py-3 px-4 font-medium text-ink">{{ h.name }}</td>
                <td class="py-3 px-4 text-ink-muted">{{ h.location }}</td>
                <td class="py-3 px-4"><StatusBadge entity="hotel" :value="h.status" size="sm" /></td>
                <td class="py-3 px-4 text-ink-muted">{{ getManager(h.managerId)?.nickname || h.managerId }}</td>
                <td class="py-3 px-4">
                  <BaseButton @click="openInfoModal(h)" variant="ghost" size="sm">
                    <Info class="w-3.5 h-3.5 mr-1" /> รายละเอียด
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
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
    <BaseModal :open="showInfoModal" @close="showInfoModal = false" title="ข้อมูลรายละเอียดโรงแรม" size="2xl">
      <div v-if="selectedHotel" class="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1.5 scrollbar-none">
        <!-- Header Info Card -->
        <div class="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 class="font-display font-bold text-xl sm:text-2xl text-ink">{{ selectedHotel.name }}</h3>
              <StatusBadge entity="hotel" :value="selectedHotel.status" size="sm" />
            </div>
            <p class="text-sm text-ink-muted flex items-center gap-1.5 mb-1">
              📍 <span class="font-medium">{{ selectedHotel.location }}</span>
            </p>
            <p class="text-xs text-ink-muted">
              👤 ผู้จัดการ: <span class="font-semibold text-ink">{{ getManager(selectedHotel.managerId)?.firstName }} {{ getManager(selectedHotel.managerId)?.lastName || '' }}</span>
              <span class="text-slate-400 ml-1">({{ getManager(selectedHotel.managerId)?.email || selectedHotel.managerId }})</span>
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
              <span>✨</span> {{ a }}
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
                    <p class="text-xs text-ink-muted">👥 รองรับ {{ room.capacity }} ท่าน</p>
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

        <!-- Actions in Modal -->
        <div class="flex items-center justify-between pt-4 border-t border-line mt-2">
          <!-- ปิดหน้าต่าง แต่ของหุบไว้ก่อน -->
          <BaseButton variant="" size="md"></BaseButton> 
          <div v-if="selectedHotel.status === 'pending'" class="flex gap-2">
            <BaseButton @click="openRejectFromModal(selectedHotel.id)" variant="danger" size="md">ปฏิเสธ</BaseButton>
            <BaseButton @click="doApproveFromModal(selectedHotel.id)" variant="secondary" size="md">อนุมัติโรงแรม</BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
