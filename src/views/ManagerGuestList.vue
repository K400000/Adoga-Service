<script setup>
// src/views/ManagerGuestList.vue
import { computed } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { checkIn, checkOut } from '../services/transitions.js'
import { formatDate, formatPrice } from '../utils/date.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'
import Sidebar from '../components/common/Sidebar.vue'

const { session } = useSession()

const myHotelIds = computed(() => {
  const userId = session.value?.userId
  if (!userId) return []
  return (db['adoga_hotels'] || [])
    .filter(h => h.managerId === userId)
    .map(h => h.id)
})

const myBookings = computed(() => {
  const hotelIds = myHotelIds.value
  if (!hotelIds.length) return []

  return (db['adoga_bookings'] || [])
    .filter(b => {
      if (!hotelIds.includes(b.hotelId)) return false
      if (b.status === 'cancelled') return false
      const isPaidOrConfirmed = b.status === 'confirmed' || b.status === 'completed' || b.paymentStatus === 'success' || !!b.checkedInAt
      return isPaidOrConfirmed
    })
    .sort((a, b) => new Date(b.createdAt || a.checkIn) - new Date(a.createdAt || b.checkIn))
})

function getHotelName(id) {
  return (db['adoga_hotels'] || []).find(h => h.id === id)?.name || id
}

function getUserName(userId) {
  const u = (db['adoga_users'] || []).find(x => x.id === userId)
  if (!u) return userId
  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim()
  return fullName || u.nickname || u.email || userId
}

const derivedStatus = (b) => {
  if (b.checkedOutAt || b.status === 'completed') return 'completed'
  if (b.checkedInAt && !b.checkedOutAt) return 'checked_in'
  return b.status
}

function doCheckIn(id) { checkIn(id) }
function doCheckOut(id) { checkOut(id) }
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <Sidebar type="manager" />
    <div class="flex-1 min-w-0 lg:ml-64 px-4 md:px-8 py-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-6">จัดการลูกค้า (Check-in / Check-out)</h1>
      <div class="bg-white rounded-2xl border border-line overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-canvas">
            <tr>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">ลูกค้า</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">โรงแรม</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">วันที่</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">สถานะ</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!myBookings.length">
              <td colspan="5" class="py-8 text-center text-ink-muted">ไม่มีรายการจองลูกค้า</td>
            </tr>
            <tr v-for="b in myBookings" :key="b.id" class="border-t border-line hover:bg-slate-50">
              <td class="py-3 px-4">
                <p class="font-medium text-ink">{{ getUserName(b.userId) }}</p>
                <p class="text-xs text-ink-muted">{{ b.guests }} ท่าน · ห้อง {{ b.roomNo }}</p>
              </td>
              <td class="py-3 px-4 text-ink font-semibold">{{ getHotelName(b.hotelId) }}</td>
              <td class="py-3 px-4 text-ink-muted">{{ formatDate(b.checkIn) }} – {{ formatDate(b.checkOut) }}</td>
              <td class="py-3 px-4">
                <StatusBadge entity="booking" :value="derivedStatus(b)" size="sm" />
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <BaseButton v-if="!b.checkedInAt && b.status !== 'completed'" @click="doCheckIn(b.id)" variant="secondary" size="sm">Check-in</BaseButton>
                  <BaseButton v-if="b.checkedInAt && !b.checkedOutAt" @click="doCheckOut(b.id)" variant="outline" size="sm">Check-out</BaseButton>
                  <span v-if="b.checkedOutAt || b.status === 'completed'" class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">✓ เช็คเอาท์แล้ว</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
