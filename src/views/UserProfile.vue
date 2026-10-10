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
import { User, LogOut } from '@lucide/vue'

const router = useRouter()
const { session } = useSession()

const user = computed(() => getCurrentUser())
const nickname = ref(user.value?.nickname || '')
const activeTab = ref('bookings')

const myBookings = computed(() => {
  const bookings = db['adoga_bookings'] || []
  return bookings.filter(b => b.userId === session.value?.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const myRefunds = computed(() => db['adoga_refunds'] || [])
const settings = computed(() => db['adoga_settings'] || { enableRefund: false })

function getHotelName(hotelId) {
  return (db['adoga_hotels'] || []).find(h => h.id === hotelId)?.name || hotelId
}

function saveNickname() {
  if (!nickname.value.trim()) return
  const users = [...(db['adoga_users'] || [])]
  const idx = users.findIndex(u => u.id === session.value.userId)
  if (idx !== -1) { users[idx] = { ...users[idx], nickname: nickname.value.trim() }; db['adoga_users'] = users }
}

function doLogout() { logout(); router.push('/') }

// Refund modal
const showRefundModal = ref(false)
const refundBookingId = ref('')
const refundReason = ref('')
function openRefundModal(bookingId) { refundBookingId.value = bookingId; refundReason.value = ''; showRefundModal.value = true }
function submitRefund() {
  const b = myBookings.value.find(x => x.id === refundBookingId.value)
  if (!b) return
  requestRefund({ bookingId: b.id, userId: session.value.userId, hotelId: b.hotelId, amount: b.totalPrice, reason: refundReason.value })
  showRefundModal.value = false
}

function doCancelBooking(bookingId) {
  if (confirm('ยืนยันการยกเลิกการจอง?')) { cancelBooking(bookingId, 'user') }
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
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <Navbar />
    <div class="mx-auto max-w-[1200px] px-4 md:px-8 py-8">

      <!-- Profile header -->
      <div class="bg-white rounded-2xl border border-line p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <User class="w-8 h-8 text-indigo-600" :stroke-width="1.75" />
        </div>
        <div class="flex-1">
          <h1 class="font-display font-semibold text-2xl text-ink">{{ user?.nickname || user?.firstName }}</h1>
          <p class="text-sm text-ink-muted">{{ user?.email }} · {{ user?.role }}</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex gap-2">
            <input v-model="nickname" class="h-10 px-3 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-indigo-600" placeholder="ชื่อเล่น" />
            <button @click="saveNickname" class="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">บันทึก</button>
          </div>
          <button @click="doLogout" class="flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors">
            <LogOut class="w-4 h-4" :stroke-width="1.75" />
            ออก
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-line mb-6">
        <button
          v-for="t in [{ key:'bookings', label:'ประวัติการจอง' }, { key:'info', label:'ข้อมูลส่วนตัว' }]"
          :key="t.key"
          @click="activeTab = t.key"
          :class="['px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors', activeTab === t.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-ink-muted hover:text-ink']"
        >{{ t.label }}</button>
      </div>

      <!-- Bookings tab -->
      <div v-if="activeTab === 'bookings'">
        <div v-if="!myBookings.length" class="py-16 text-center">
          <p class="text-lg font-medium text-ink mb-1">ยังไม่มีการจอง</p>
          <p class="text-sm text-ink-muted mb-4">เริ่มค้นหาที่พักที่คุณชอบ</p>
          <router-link to="/" class="h-10 px-5 rounded-full bg-coral-600 text-white text-sm font-medium inline-flex items-center hover:bg-coral-700">ค้นหาที่พัก</router-link>
        </div>
        <div v-else class="flex flex-col gap-4">
          <div v-for="b in myBookings" :key="b.id" class="bg-white rounded-2xl border border-line p-4 md:p-6">
            <div class="flex flex-col md:flex-row md:items-start gap-4">
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <h3 class="font-display font-semibold text-base text-ink">{{ getHotelName(b.hotelId) }}</h3>
                  <StatusBadge entity="booking" :value="derivedBookingStatus(b)" />
                  <StatusBadge entity="payment" :value="b.paymentStatus" size="sm" />
                </div>
                <p class="text-sm text-ink-muted mb-1">{{ formatDate(b.checkIn) }} → {{ formatDate(b.checkOut) }} · {{ b.nights }} คืน · {{ b.guests }} ท่าน</p>
                <p class="font-display font-semibold text-lg text-ink tabular-nums">{{ formatPrice(b.totalPrice) }}</p>

                <!-- Refund status -->
                <div v-if="refundForBooking(b.id)" class="mt-2 flex items-center gap-2">
                  <span class="text-xs text-ink-muted">ใบขอคืนเงิน:</span>
                  <StatusBadge entity="refund" :value="refundForBooking(b.id).status" size="sm" />
                </div>
              </div>
              <!-- Actions -->
              <div class="flex flex-wrap gap-2">
                <BaseButton
                  v-if="b.status === 'pending_payment'"
                  @click="doCancelBooking(b.id)"
                  variant="danger"
                  size="sm"
                >ยกเลิก</BaseButton>
                <BaseButton
                  v-if="canRefund(b)"
                  @click="openRefundModal(b.id)"
                  variant="outline"
                  size="sm"
                >ขอคืนเงิน</BaseButton>
                <BaseButton
                  v-else-if="b.status === 'confirmed' && !refundForBooking(b.id) && !settings.enableRefund"
                  :disabled="true"
                  size="sm"
                >คืนเงิน (Coming Soon)</BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info tab -->
      <div v-if="activeTab === 'info'" class="bg-white rounded-2xl border border-line p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><p class="text-xs text-ink-muted mb-1">ชื่อ</p><p class="text-sm font-medium text-ink">{{ user?.firstName }} {{ user?.lastName }}</p></div>
          <div><p class="text-xs text-ink-muted mb-1">ชื่อเล่น</p><p class="text-sm font-medium text-ink">{{ user?.nickname }}</p></div>
          <div><p class="text-xs text-ink-muted mb-1">อีเมล</p><p class="text-sm font-medium text-ink">{{ user?.email }}</p></div>
          <div><p class="text-xs text-ink-muted mb-1">บทบาท</p><p class="text-sm font-medium text-ink">{{ user?.role }}</p></div>
        </div>
      </div>
    </div>

    <!-- Refund modal -->
    <BaseModal :open="showRefundModal" @close="showRefundModal = false" title="ยื่นขอคืนเงิน">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-ink-muted">กรุณากรอกเหตุผลในการขอคืนเงิน</p>
        <textarea v-model="refundReason" rows="3" placeholder="เหตุผล..." class="w-full px-4 py-3 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-indigo-600 resize-none" />
        <div class="flex gap-3 justify-end">
          <BaseButton @click="showRefundModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
          <BaseButton @click="submitRefund" variant="secondary" size="md" :disabled="!refundReason.trim()">ยื่นคำขอ</BaseButton>
        </div>
      </div>
    </BaseModal>

    <Footer />
  </div>
</template>
