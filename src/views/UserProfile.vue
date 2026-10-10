<script setup>
// src/views/UserProfile.vue
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { getCurrentUser, logout } from '../services/authService.js'
import { requestRefund, cancelBooking } from '../services/transitions.js'
import { formatPrice, formatDate } from '../utils/date.js'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseModal from '../components/common/BaseModal.vue'
import BaseButton from '../components/common/BaseButton.vue'
import {
  User, Lock, Mail, Shield, CheckCircle2,
  Calendar, LogOut, Edit3, Clock
} from '@lucide/vue'

const router = useRouter()
const { session } = useSession()

const user = computed(() => getCurrentUser())
const emailInput = ref(user.value?.email || '')
const activeTab = ref('info') // Default to Info tab

const showEmailSuccessAlert = ref(false)

const myBookings = computed(() => {
  const bookings = db['adoga_bookings'] || []
  return bookings.filter(b => b.userId === session.value?.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const myRefunds = computed(() => db['adoga_refunds'] || [])
const settings = computed(() => db['adoga_settings'] || { enableRefund: false })

function getHotelName(hotelId) {
  return (db['adoga_hotels'] || []).find(h => h.id === hotelId)?.name || hotelId
}

function saveEmail() {
  if (!emailInput.value.trim()) return
  const users = [...(db['adoga_users'] || [])]
  const idx = users.findIndex(u => u.id === session.value?.userId)
  if (idx !== -1) {
    users[idx] = { ...users[idx], email: emailInput.value.trim() }
    db['adoga_users'] = users
    showEmailSuccessAlert.value = true
  }
}

function doLogout() {
  logout()
  router.push('/auth')
}

// Refund modal
const showRefundModal = ref(false)
const refundBookingId = ref('')
const refundReason = ref('')

function openRefundModal(bookingId) {
  refundBookingId.value = bookingId
  refundReason.value = ''
  showRefundModal.value = true
}

function submitRefund() {
  const b = myBookings.value.find(x => x.id === refundBookingId.value)
  if (!b) return
  requestRefund({
    bookingId: b.id,
    userId: session.value.userId,
    hotelId: b.hotelId,
    amount: b.totalPrice,
    reason: refundReason.value
  })
  showRefundModal.value = false
}

function doCancelBooking(bookingId) {
  if (confirm('ยืนยันการยกเลิกการจอง?')) {
    cancelBooking(bookingId, 'user')
  }
}

function refundForBooking(bookingId) {
  return myRefunds.value.find(r => r.bookingId === bookingId)
}

function canRefund(b) {
  return settings.value.enableRefund
    && b.status === 'confirmed'
    && b.paymentStatus === 'success'
    && !b.checkedOutAt
    && !refundForBooking(b.id)
}

const derivedBookingStatus = (b) => {
  if (b.status === 'confirmed' && b.checkedInAt && !b.checkedOutAt) return 'checked_in'
  return b.status
}

function getRoleLabel(role) {
  if (role === 'admin') return 'ผู้ดูแลระบบ (Admin)'
  if (role === 'manager') return 'ผู้ประกอบการโรงแรม (Manager)'
  return 'ผู้ใช้งานทั่วไป (User)'
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col justify-between w-full overflow-x-hidden">
    <div class="w-full flex-1 flex flex-col justify-start">
      <Navbar />

      <main class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-10 flex-1">
        
        <!-- Header Banner Card -->
        <div class="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-bold text-3xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              {{ (user?.nickname || user?.firstName || 'U')[0].toUpperCase() }}
            </div>
            <div>
              <h1 class="font-display font-bold text-2xl sm:text-3xl text-slate-900 mb-1">
                {{ user?.firstName }} {{ user?.lastName }}
              </h1>
              <p class="text-base font-semibold text-slate-500 flex items-center gap-2">
                <span>{{ user?.email }}</span>
                <span>·</span>
                <span class="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {{ getRoleLabel(user?.role) }}
                </span>
              </p>
            </div>
          </div>

          <button
            @click="doLogout"
            type="button"
            class="h-11 px-5 rounded-full text-base font-semibold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 hover:border-rose-300 flex items-center gap-2 cursor-pointer"
          >
            <LogOut class="w-5 h-5 text-rose-500" :stroke-width="2" />
            <span>ออกจากระบบ</span>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex border-b-2 border-slate-200 mb-8 gap-6">
          <button
            @click="activeTab = 'info'"
            :class="[
              'pb-3 text-lg font-bold transition-all border-b-4 -mb-1 cursor-pointer flex items-center gap-2',
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            ]"
          >
            <User class="w-5 h-5" />
            <span>ข้อมูลส่วนตัว</span>
          </button>

          <button
            @click="activeTab = 'bookings'"
            :class="[
              'pb-3 text-lg font-bold transition-all border-b-4 -mb-1 cursor-pointer flex items-center gap-2',
              activeTab === 'bookings'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            ]"
          >
            <Calendar class="w-5 h-5" />
            <span>ประวัติการจองที่พัก</span>
          </button>
        </div>

        <!-- TAB 1: INFO (Personal Details) -->
        <div v-if="activeTab === 'info'" class="space-y-6">
          
          <!-- Success Email Update Alert Banner -->
          <Transition name="fade">
            <div v-if="showEmailSuccessAlert" class="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-emerald-900 flex items-start gap-4 shadow-sm">
              <CheckCircle2 class="w-7 h-7 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h4 class="font-bold text-lg text-emerald-950 mb-1">บันทึกการเปลี่ยนแปลงอีเมลสำเร็จ!</h4>
                <p class="text-sm sm:text-base font-medium text-emerald-800">
                  ระบบได้ทำการอัปเดตอีเมลใหม่ของคุณเรียบร้อยแล้ว <strong class="underline decoration-emerald-500">(สามารถแก้ไขอีเมลได้อีกครั้งในอีก 3 เดือนข้างหน้า)</strong>
                </p>
              </div>
              <button @click="showEmailSuccessAlert = false" class="text-emerald-700 hover:text-emerald-950 font-bold text-sm cursor-pointer">✕</button>
            </div>
          </Transition>

          <!-- Large Readable Personal Details Card Grid -->
          <div class="bg-white rounded-3xl border border-line p-6 sm:p-10 shadow-sm space-y-8">
            <h2 class="font-display font-bold text-xl sm:text-2xl text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <span>📋 รายละเอียดบัญชีผู้ใช้</span>
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              
              <!-- 1. ชื่อจริง - นามสกุล [แก้ไม่ได้] -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <User class="w-4 h-4 text-indigo-600" />
                    1. ชื่อจริง - นามสกุล
                  </span>
                </label>
                <div class="w-full h-14 px-5 bg-slate-100/80 border-2 border-slate-200 rounded-2xl flex items-center text-slate-700 font-bold text-lg select-none">
                  {{ user?.firstName }} {{ user?.lastName }}
                </div>
              </div>

              <!-- 2. ชื่อเล่น [แก้ไม่ได้] -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <User class="w-4 h-4 text-indigo-600" />
                    2. ชื่อเล่น
                  </span>
                </label>
                <div class="w-full h-14 px-5 bg-slate-100/80 border-2 border-slate-200 rounded-2xl flex items-center text-slate-700 font-bold text-lg select-none">
                  {{ user?.nickname }}
                </div>
              </div>

              <!-- 3. อีเมล [แก้ได้] -->
              <div class="space-y-2 md:col-span-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <Mail class="w-4 h-4 text-indigo-600" />
                    3. อีเมล
                  </span>
                </label>
                
                <div class="flex flex-col sm:flex-row gap-3">
                  <div class="flex-1 relative">
                    <input
                      v-model="emailInput"
                      type="email"
                      placeholder="ระบุอีเมลของคุณ..."
                      class="w-full h-14 px-5 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-2xl text-slate-900 font-bold text-lg outline-none transition-colors shadow-xs"
                    />
                  </div>
                  <button
                    @click="saveEmail"
                    type="button"
                    class="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <CheckCircle2 class="w-5 h-5" />
                    <span>บันทึกอีเมล</span>
                  </button>
                </div>
                
                <p class="text-xs font-medium text-slate-400 flex items-center gap-1 pt-1">
                  <Clock class="w-3.5 h-3.5 text-amber-500" />
                  <span>หมายเหตุ: หลังจากกดบันทึกแล้ว คุณจะสามารถเปลี่ยนอีเมลได้อีกครั้งในอีก 3 เดือนข้างหน้า</span>
                </p>
              </div>

              <!-- 4. บทบาท [แก้ไม่ได้] -->
              <div class="space-y-2 md:col-span-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <Shield class="w-4 h-4 text-indigo-600" />
                    4. บทบาทผู้ใช้งาน
                  </span>
                </label>
                <div class="w-full h-14 px-5 bg-slate-100/80 border-2 border-slate-200 rounded-2xl flex items-center text-slate-800 font-bold text-lg select-none">
                  {{ getRoleLabel(user?.role) }}
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- TAB 2: BOOKINGS (Booking History) -->
        <div v-if="activeTab === 'bookings'">
          <div v-if="!myBookings.length" class="bg-white rounded-3xl border border-line py-16 px-4 text-center">
            <Calendar class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-xl font-bold text-slate-900 mb-1">ยังไม่มีรายการจองที่พัก</p>
            <p class="text-base text-slate-500 mb-6 max-w-sm mx-auto">เริ่มค้นหาที่พักและจุดหมายปลายทางในราคาพิเศษทั่วไทย</p>
            <router-link
              to="/home"
              class="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 no-underline transition-all"
            >
              <span>ค้นหาที่พักเลย</span>
            </router-link>
          </div>

          <div v-else class="flex flex-col gap-4">
            <div v-for="b in myBookings" :key="b.id" class="bg-white rounded-3xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div class="flex-1 space-y-2">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h3 class="font-display font-bold text-xl text-slate-900">{{ getHotelName(b.hotelId) }}</h3>
                    <StatusBadge entity="booking" :value="derivedBookingStatus(b)" />
                    <StatusBadge entity="payment" :value="b.paymentStatus" size="sm" />
                  </div>
                  <p class="text-base font-semibold text-slate-600">
                    📅 {{ formatDate(b.checkIn) }} → {{ formatDate(b.checkOut) }} · {{ b.nights }} คืน · {{ b.guests }} ท่าน
                  </p>
                  <p class="font-display font-bold text-2xl text-indigo-600 tabular-nums">
                    {{ formatPrice(b.totalPrice) }}
                  </p>

                  <div v-if="refundForBooking(b.id)" class="mt-2 flex items-center gap-2">
                    <span class="text-xs font-semibold text-slate-500">ใบขอคืนเงิน:</span>
                    <StatusBadge entity="refund" :value="refundForBooking(b.id).status" size="sm" />
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <BaseButton
                    v-if="b.status === 'pending_payment'"
                    @click="doCancelBooking(b.id)"
                    variant="danger"
                    size="md"
                  >ยกเลิกการจอง</BaseButton>
                  
                  <BaseButton
                    v-if="canRefund(b)"
                    @click="openRefundModal(b.id)"
                    variant="outline"
                    size="md"
                  >ขอคืนเงิน</BaseButton>
                  
                  <BaseButton
                    v-else-if="b.status === 'confirmed' && !refundForBooking(b.id) && !settings.enableRefund"
                    :disabled="true"
                    size="md"
                  >ขอคืนเงิน (Coming Soon)</BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- Refund Modal -->
    <BaseModal :open="showRefundModal" @close="showRefundModal = false" title="ยื่นขอคืนเงิน">
      <div class="flex flex-col gap-4">
        <p class="text-base text-slate-600">กรุณากรอกเหตุผลในการขอคืนเงิน</p>
        <textarea
          v-model="refundReason"
          rows="3"
          placeholder="ระบุเหตุผล..."
          class="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-base text-slate-900 outline-none focus:border-indigo-600 resize-none font-medium"
        />
        <div class="flex gap-3 justify-end pt-2">
          <BaseButton @click="showRefundModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
          <BaseButton @click="submitRefund" variant="secondary" size="md" :disabled="!refundReason.trim()">ยื่นคำขอ</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Footer Pinned to Bottom -->
    <Footer />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 300ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
