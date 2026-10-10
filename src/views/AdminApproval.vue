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
import { CheckSquare, Settings, LayoutDashboard } from '@lucide/vue'
import { FALLBACK_IMAGE } from '../constants/images.js'

const pendingHotels = computed(() => (db['adoga_hotels'] || []).filter(h => h.status === 'pending'))
const allHotels = computed(() => db['adoga_hotels'] || [])

const showRejectModal = ref(false)
const rejectHotelId = ref('')
const rejectReason = ref('')

function doApprove(id) { approveHotel(id) }
function openReject(id) { rejectHotelId.value = id; rejectReason.value = ''; showRejectModal.value = true }
function doReject() { rejectHotel(rejectHotelId.value, rejectReason.value); showRejectModal.value = false }

function getManager(managerId) { return (db['adoga_users'] || []).find(u => u.id === managerId) }
</script>

<template>
  <div class="min-h-screen bg-canvas flex">
    <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-line py-6 px-4 sticky top-0 h-screen">
      <p class="text-xs font-medium text-ink-muted mb-4 px-2">ADMIN CONSOLE</p>
      <nav class="flex flex-col gap-1">
        <RouterLink to="/admin" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100"><LayoutDashboard class="w-5 h-5" :stroke-width="1.75" /> แดชบอร์ด</RouterLink>
        <RouterLink to="/admin/approval" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50"><CheckSquare class="w-5 h-5" :stroke-width="1.75" /> อนุมัติโรงแรม</RouterLink>
        <RouterLink to="/admin/settings" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100"><Settings class="w-5 h-5" :stroke-width="1.75" /> ตั้งค่า</RouterLink>
      </nav>
    </aside>
    <div class="flex-1 px-4 md:px-8 py-8">
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
              <div class="flex gap-3">
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in allHotels" :key="h.id" class="border-t border-line hover:bg-slate-50">
                <td class="py-3 px-4 font-medium text-ink">{{ h.name }}</td>
                <td class="py-3 px-4 text-ink-muted">{{ h.location }}</td>
                <td class="py-3 px-4"><StatusBadge entity="hotel" :value="h.status" size="sm" /></td>
                <td class="py-3 px-4 text-ink-muted">{{ getManager(h.managerId)?.nickname }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

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
  </div>
</template>
