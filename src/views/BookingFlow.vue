<script setup>
// src/views/BookingFlow.vue
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { createBooking, startPayment, finishPayment, retryPayment, cancelBooking } from '../services/transitions.js'
import { formatPrice, formatDate, countdown } from '../utils/date.js'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import StatusStepper from '../components/common/StatusStepper.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseModal from '../components/common/BaseModal.vue'

const route = useRoute()
const router = useRouter()
const { session } = useSession()

const hotel = computed(() => (db['adoga_hotels'] || []).find(h => h.id === route.params.hotelId))
const room = computed(() => {
  const rid = route.query.roomId
  return hotel.value?.rooms?.find(r => r.id === rid) || hotel.value?.rooms?.[0]
})

// Find existing pending booking for this user+hotel
const existingBooking = computed(() => {
  const bookings = db['adoga_bookings'] || []
  return bookings.find(b => b.userId === session.value?.userId && b.hotelId === hotel.value?.id && b.status === 'pending_payment')
})

const booking = ref(null)
const step = ref('select') // select | payment | done
const paymentMethod = ref('QR')
const simulateFail = ref(false)
const payLoading = ref(false)
const showPayModal = ref(false)

// Countdown
const countdownText = ref('')
const countdownUrgent = ref(false)
const countdownWarn = ref(false)
let timer = null

function startCountdown() {
  if (!booking.value?.expiresAt) return
  timer = setInterval(() => {
    const cd = countdown(booking.value.expiresAt)
    countdownText.value = cd.text
    countdownUrgent.value = cd.urgent
    countdownWarn.value = cd.warn
    if (cd.expired) { clearInterval(timer); refreshBooking() }
  }, 1000)
}

function refreshBooking() {
  const bookings = db['adoga_bookings'] || []
  booking.value = bookings.find(b => b.id === booking.value?.id) || null
}

// Step 1 form
const checkIn = ref('')
const checkOut = ref('')
const guests = ref(2)
const bookingError = ref('')

const nights = computed(() => {
  if (!checkIn.value || !checkOut.value) return 0
  const diff = new Date(checkOut.value) - new Date(checkIn.value)
  return Math.max(0, Math.floor(diff / 86400000))
})

const totalPrice = computed(() => {
  if (!room.value || !nights.value) return 0
  return Math.round(nights.value * room.value.price * (1 - (hotel.value?.discount || 0) / 100))
})

function doBook() {
  if (!checkIn.value || !checkOut.value || nights.value < 1) { bookingError.value = 'กรุณาเลือกวันที่ที่ถูกต้อง'; return }
  const avail = room.value?.units?.find(u => u.status === 'available')
  if (!avail) { bookingError.value = 'ห้องเต็มแล้ว'; return }
  bookingError.value = ''
  const b = createBooking({
    userId: session.value.userId,
    hotelId: hotel.value.id,
    roomId: room.value.id,
    roomNo: avail.no,
    guests: guests.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    nights: nights.value,
    totalPrice: totalPrice.value,
    paymentMethod: paymentMethod.value,
  })
  booking.value = b
  step.value = 'payment'
  startCountdown()
}

async function doPay() {
  payLoading.value = true
  try {
    startPayment(booking.value.id)
    refreshBooking()
    await new Promise(r => setTimeout(r, 600))
    finishPayment(booking.value.id, !simulateFail.value)
    refreshBooking()
    if (!simulateFail.value) step.value = 'done'
  } catch (err) {
    console.error('Payment error:', err)
  } finally {
    payLoading.value = false
    showPayModal.value = false
  }
}

function doRetry() { retryPayment(booking.value.id); refreshBooking() }
function doCancel() { cancelBooking(booking.value.id); router.push('/') }

const bookingSteps = computed(() => {
  const b = booking.value
  if (!b) return []
  const isCancelled = b.status === 'cancelled'
  return [
    { key: 'pending', label: 'รอชำระเงิน', done: b.status !== 'pending_payment', current: b.status === 'pending_payment', cancelled: false },
    { key: 'confirmed', label: 'ยืนยันแล้ว', done: b.status === 'completed', current: b.status === 'confirmed', cancelled: isCancelled },
    { key: 'completed', label: 'เสร็จสิ้น', done: b.status === 'completed', current: false, cancelled: false },
  ]
})

onMounted(() => {
  const bId = route.query.bookingId
  const bookings = db['adoga_bookings'] || []
  let pending = null
  if (bId) {
    pending = bookings.find(b => b.id === bId && b.userId === session.value?.userId && b.status === 'pending_payment')
  }
  if (!pending && existingBooking.value) {
    pending = existingBooking.value
  }
  if (pending) {
    booking.value = pending
    step.value = 'payment'
    startCountdown()
  }
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <Navbar />
    <div class="mx-auto max-w-[1200px] px-4 md:px-8 py-8">

      <h1 class="font-display font-semibold text-2xl text-ink mb-2">จองที่พัก</h1>
      <p class="text-ink-muted mb-6">{{ hotel?.name }}</p>

      <!-- Stepper -->
      <div v-if="booking" class="bg-white rounded-2xl border border-line p-6 mb-6">
        <StatusStepper :steps="bookingSteps" :horizontal="true" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Main -->
        <div class="lg:col-span-8">
          <!-- Select step -->
          <div v-if="step === 'select'" class="bg-white rounded-2xl border border-line p-6">
            <h2 class="font-display font-semibold text-xl text-ink mb-6">ข้อมูลการจอง</h2>
            <div class="flex flex-col gap-6">
              <div class="p-4 bg-canvas rounded-xl border border-line">
                <p class="font-medium text-ink">{{ room?.type }}</p>
                <p class="text-sm text-ink-muted mt-1">รองรับ {{ room?.capacity }} ท่าน</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-ink">วันเช็คอิน *</label>
                  <input type="date" v-model="checkIn" class="h-12 px-4 rounded-xl border border-line text-ink focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-ink">วันเช็คเอาท์ *</label>
                  <input type="date" v-model="checkOut" class="h-12 px-4 rounded-xl border border-line text-ink focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-ink">จำนวนผู้เข้าพัก</label>
                <select v-model="guests" class="h-12 px-4 rounded-xl border border-line text-ink focus:outline-none focus:border-indigo-600">
                  <option v-for="n in (room?.capacity || 4)" :key="n" :value="n">{{ n }} ท่าน</option>
                </select>
              </div>
              <!-- Payment method -->
              <div>
                <p class="text-sm font-medium text-ink mb-3">วิธีชำระเงิน</p>
                <div class="flex gap-3">
                  <button
                    v-for="m in [{ key:'QR', label:'QR PromptPay' }, { key:'BANK_TRANSFER', label:'โอนเงิน' }]"
                    :key="m.key"
                    @click="paymentMethod = m.key"
                    :class="['flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-colors', paymentMethod === m.key ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-line text-ink-muted hover:border-indigo-200']"
                  >{{ m.label }}</button>
                </div>
              </div>
              <p v-if="bookingError" class="text-sm text-rose-700">{{ bookingError }}</p>
              <BaseButton @click="doBook" variant="primary" size="lg" :disabled="!nights" class="w-full">
                จองห้องพัก ({{ nights }} คืน)
              </BaseButton>
            </div>
          </div>

          <!-- Payment step -->
          <div v-else-if="step === 'payment'" class="flex flex-col gap-4">
            <div class="bg-white rounded-2xl border border-line p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h2 class="font-display font-semibold text-xl text-ink">ชำระเงิน</h2>
                  <p class="text-sm text-ink-muted mt-1">รหัสการจอง: {{ booking.id }}</p>
                </div>
                <StatusBadge entity="payment" :value="booking.paymentStatus" />
              </div>

              <!-- Countdown -->
              <div class="p-4 rounded-xl bg-canvas border border-line mb-4">
                <p class="text-sm text-ink-muted mb-1">หมดเวลาชำระภายใน</p>
                <p :class="['font-display font-semibold text-2xl tabular-nums', countdownUrgent ? 'text-rose-700' : countdownWarn ? 'text-amber-700' : 'text-indigo-700']">
                  {{ countdownText || '--:--:--' }}
                </p>
              </div>

              <!-- Payment display -->
              <div class="p-6 rounded-xl bg-canvas border border-line text-center mb-4">
                <p class="text-sm text-ink-muted mb-2">{{ booking.paymentMethod === 'QR' ? 'QR PromptPay' : 'โอนเงิน' }}</p>
                <div class="w-40 h-40 mx-auto bg-white border border-line rounded-xl flex items-center justify-center text-ink-muted text-xs">
                  [QR Code Mock]
                </div>
                <p class="mt-3 font-display font-semibold text-2xl text-ink tabular-nums">{{ formatPrice(booking.totalPrice) }}</p>
              </div>

              <!-- Simulate fail toggle -->
              <label class="flex items-center gap-2 text-sm text-ink-muted cursor-pointer mb-4">
                <input type="checkbox" v-model="simulateFail" class="w-4 h-4" />
                จำลองการชำระล้มเหลว (เพื่อทดสอบ)
              </label>

              <div v-if="booking.paymentStatus === 'failed'" class="mb-4 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
                การชำระเงินไม่สำเร็จ กรุณาลองใหม่
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <BaseButton
                  v-if="booking.paymentStatus === 'failed'"
                  @click="doRetry"
                  variant="outline"
                  size="md"
                  class="flex-1"
                >ชำระใหม่</BaseButton>
                <BaseButton
                  v-if="['awaiting', 'failed'].includes(booking.paymentStatus)"
                  @click="showPayModal = true"
                  variant="primary"
                  size="md"
                  class="flex-1"
                >ฉันชำระเงินแล้ว</BaseButton>
                <BaseButton @click="doCancel" variant="ghost" size="md">ยกเลิก</BaseButton>
              </div>
            </div>
          </div>

          <!-- Done step -->
          <div v-else class="bg-white rounded-2xl border border-line p-8 text-center">
            <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 class="font-display font-semibold text-2xl text-ink mb-2">จองสำเร็จ! 🎉</h2>
            <p class="text-ink-muted mb-6">การจองของคุณได้รับการยืนยันแล้ว</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <BaseButton @click="router.push('/profile')" variant="secondary" size="md">ดูประวัติการจอง</BaseButton>
              <BaseButton @click="router.push('/')" variant="outline" size="md">กลับหน้าแรก</BaseButton>
            </div>
          </div>
        </div>

        <!-- Summary sidebar -->
        <div class="lg:col-span-4">
          <div class="sticky top-24 bg-white rounded-2xl border border-line p-6">
            <h3 class="font-display font-semibold text-lg text-ink mb-4">สรุปการจอง</h3>
            <div class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between"><span class="text-ink-muted">ที่พัก</span><span class="text-ink font-medium">{{ hotel?.name }}</span></div>
              <div class="flex justify-between"><span class="text-ink-muted">ประเภทห้อง</span><span class="text-ink">{{ room?.type }}</span></div>
              <div v-if="nights" class="flex justify-between"><span class="text-ink-muted">จำนวนคืน</span><span class="text-ink">{{ nights }} คืน</span></div>
              <div v-if="guests" class="flex justify-between"><span class="text-ink-muted">ผู้เข้าพัก</span><span class="text-ink">{{ guests }} ท่าน</span></div>
              <div class="border-t border-line pt-3 flex justify-between">
                <span class="font-medium text-ink">ยอดรวม</span>
                <span class="font-display font-semibold text-xl text-ink tabular-nums">{{ formatPrice(totalPrice || booking?.totalPrice || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment confirm modal -->
    <BaseModal :open="showPayModal" @close="showPayModal = false" title="ยืนยันการชำระเงิน">
      <p class="text-sm text-ink-muted mb-6">ระบบจะตรวจสอบการชำระเงินของคุณ กรุณารอสักครู่</p>
      <div class="flex gap-3 justify-end">
        <BaseButton @click="showPayModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
        <BaseButton @click="doPay" variant="secondary" size="md" :loading="payLoading">ยืนยัน</BaseButton>
      </div>
    </BaseModal>

    <Footer />
  </div>
</template>
