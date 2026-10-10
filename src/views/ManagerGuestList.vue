<script setup>
// src/views/ManagerGuestList.vue
import { computed } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { checkIn, checkOut } from '../services/transitions.js'
import { formatDate, formatPrice } from '../utils/date.js'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseButton from '../components/common/BaseButton.vue'

const { session } = useSession()
const myHotelIds = computed(() => (db['adoga_hotels'] || []).filter(h => h.managerId === session.value?.userId).map(h => h.id))
const myBookings = computed(() => (db['adoga_bookings'] || []).filter(b => myHotelIds.value.includes(b.hotelId) && b.status === 'confirmed').sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn)))

function getHotelName(id) { return (db['adoga_hotels'] || []).find(h => h.id === id)?.name || id }
function getUser(id) { return (db['adoga_users'] || []).find(u => u.id === id) }
const derivedStatus = (b) => b.checkedInAt && !b.checkedOutAt ? 'checked_in' : b.status

function doCheckIn(id) { checkIn(id) }
function doCheckOut(id) { checkOut(id) }
</script>

<template>
  <div class="min-h-screen bg-canvas flex">
    <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-line py-6 px-4 sticky top-0 h-screen">
      <p class="text-xs font-medium text-ink-muted mb-4 px-2">MANAGER PORTAL</p>
      <nav class="flex flex-col gap-1">
        <router-link to="/manager" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100">ภาพรวม</router-link>
        <router-link to="/manager/guests" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50">จัดการแขก</router-link>
        <router-link to="/manager/messages" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100">ข้อความ</router-link>
      </nav>
    </aside>
    <div class="flex-1 px-4 md:px-8 py-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-6">จัดการแขก (Check-in / Check-out)</h1>
      <div class="bg-white rounded-2xl border border-line overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-canvas">
            <tr>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">แขก</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">โรงแรม</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">วันที่</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">สถานะ</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!myBookings.length">
              <td colspan="5" class="py-8 text-center text-ink-muted">ไม่มีรายการ</td>
            </tr>
            <tr v-for="b in myBookings" :key="b.id" class="border-t border-line hover:bg-slate-50">
              <td class="py-3 px-4">
                <p class="font-medium text-ink">{{ getUser(b.userId)?.nickname || b.userId }}</p>
                <p class="text-xs text-ink-muted">{{ b.guests }} ท่าน · ห้อง {{ b.roomNo }}</p>
              </td>
              <td class="py-3 px-4 text-ink">{{ getHotelName(b.hotelId) }}</td>
              <td class="py-3 px-4 text-ink-muted">{{ formatDate(b.checkIn) }} – {{ formatDate(b.checkOut) }}</td>
              <td class="py-3 px-4">
                <StatusBadge entity="booking" :value="derivedStatus(b)" size="sm" />
              </td>
              <td class="py-3 px-4">
                <div class="flex gap-2">
                  <BaseButton v-if="!b.checkedInAt" @click="doCheckIn(b.id)" variant="secondary" size="sm">Check-in</BaseButton>
                  <BaseButton v-if="b.checkedInAt && !b.checkedOutAt" @click="doCheckOut(b.id)" variant="outline" size="sm">Check-out</BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
