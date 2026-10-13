<script setup>
// src/views/UserProfile.vue
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { getCurrentUser, logout } from '../services/authService.js'
import { requestRefund, cancelBooking } from '../services/transitions.js'
import { formatPrice, formatDate, thaiBahtText } from '../utils/date.js'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import BaseModal from '../components/common/BaseModal.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { showToast } from '../utils/toast.js'
import {
  User, Lock, Mail, Shield, CheckCircle2,
  Calendar, LogOut, Edit3, Clock, Phone, Cake, Send, Star,
  FileText, Printer, Download, RotateCcw, X, BedDouble, Building, CreditCard
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

function requestChangeEmail() {
  showEmailSuccessAlert.value = true
}

function calculateAge(birthdateStr) {
  if (!birthdateStr) return '-'
  const birth = new Date(birthdateStr)
  if (isNaN(birth.getTime())) return '-'
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age > 0 ? `${age} ปี` : '-'
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
  const hasRefund = !!refundForBooking(b.id)
  const isPaid = (b.status === 'confirmed' || b.paymentStatus === 'success')
  const isNotCheckedInOrOut = !b.checkedInAt && !b.checkedOutAt && b.status !== 'completed' && b.status !== 'cancelled'
  const isBeforeCheckOut = new Date(b.checkOut) > new Date()
  return isPaid && isNotCheckedInOrOut && !hasRefund && isBeforeCheckOut
}

// Review management state & methods
const showReviewModal = ref(false)
const reviewBooking = ref(null)
const reviewRating = ref(5)
const reviewComment = ref('')

function canReview(b) {
  // ไม่สามารถรีวิวได้ หากมีการยื่นขอคืนเงิน (ที่ไม่ได้ถูกปฏิเสธ) หรือการจองถูกยกเลิก/คืนเงินแล้ว
  const refund = refundForBooking(b.id)
  if (refund && refund.status !== 'rejected') return false
  if (b.status === 'cancelled' || b.paymentStatus === 'refunded') return false

  // ผู้เข้าพักต้องเช็คเอาท์แล้วจริง ๆ (สถานะ completed หรือมี checkedOutAt)
  const isCheckedOut = b.status === 'completed' || !!b.checkedOutAt
  return isCheckedOut
}

function getReviewForBooking(bookingId) {
  const list = db['adoga_reviews'] || []
  return list.find(r => r.bookingId === bookingId)
}

function openReviewModal(b) {
  reviewBooking.value = b
  const existing = getReviewForBooking(b.id)
  if (existing) {
    reviewRating.value = existing.rating || 5
    reviewComment.value = existing.comment || ''
  } else {
    reviewRating.value = 5
    reviewComment.value = ''
  }
  showReviewModal.value = true
}

function submitReview() {
  if (!reviewBooking.value) return
  if (!reviewComment.value.trim()) {
    showToast('กรุณากรอกข้อความรีวิว', 'error')
    return
  }
  const b = reviewBooking.value
  const reviews = [...(db['adoga_reviews'] || [])]
  const existingIndex = reviews.findIndex(r => r.bookingId === b.id)

  const reviewData = {
    id: existingIndex !== -1 ? reviews[existingIndex].id : `R${Date.now()}`,
    bookingId: b.id,
    hotelId: b.hotelId,
    userId: session.value?.userId || 'U001',
    rating: Number(reviewRating.value) || 5,
    comment: reviewComment.value.trim(),
    date: new Date().toISOString()
  }

  if (existingIndex !== -1) {
    reviews[existingIndex] = reviewData
  } else {
    reviews.push(reviewData)
  }

  db['adoga_reviews'] = reviews

  // Calculate and update hotel overall rating in adoga_hotels store
  const hotelReviews = reviews.filter(r => r.hotelId === b.hotelId)
  if (hotelReviews.length > 0) {
    const newAvg = hotelReviews.reduce((sum, r) => sum + r.rating, 0) / hotelReviews.length
    const hotels = [...(db['adoga_hotels'] || [])]
    const hIdx = hotels.findIndex(h => h.id === b.hotelId)
    if (hIdx !== -1) {
      hotels[hIdx] = { ...hotels[hIdx], rating: Number(newAvg.toFixed(1)) }
      db['adoga_hotels'] = hotels
    }
  }

  showToast('บันทึกรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น!', 'success')
  showReviewModal.value = false
}

const derivedBookingStatus = (b) => {
  if (b.status === 'confirmed' && b.checkedInAt && !b.checkedOutAt) return 'checked_in'
  return b.status
}

function shouldShowPaymentBadge(b) {
  if (b.status === 'cancelled' && ['waiting', 'awaiting', 'failed'].includes(b.paymentStatus)) {
    return false
  }
  return true
}

function getRoleLabel(role) {
  if (role === 'admin') return 'ผู้ดูแลระบบ (Admin)'
  if (role === 'manager') return 'ผู้ประกอบการโรงแรม (Manager)'
  return 'ผู้ใช้งานทั่วไป (User)'
}

function getHotel(hotelId) {
  return (db['adoga_hotels'] || []).find(h => h.id === hotelId)
}

function getRoomType(hotelId, roomId) {
  const hotel = (db['adoga_hotels'] || []).find(h => h.id === hotelId)
  if (!hotel) return 'ห้องพักมาตรฐาน'
  const room = hotel.rooms?.find(r => r.id === roomId)
  return room?.type || room?.name || 'Standard Room'
}

function getDocNumber(booking, docType) {
  if (!booking) return ''
  const dateStr = booking.createdAt ? new Date(booking.createdAt).toISOString().slice(0, 10).replace(/-/g, '') : '20261013'
  if (docType === 'receipt') {
    return `ADM-REC-${dateStr}-${booking.id}`
  } else {
    const ref = refundForBooking(booking.id)
    return `ADM-REF-${dateStr}-${ref?.id || booking.id}`
  }
}

function getDocProcessTime(iso) {
  const d = iso ? new Date(iso) : new Date()
  const datePart = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} เวลา ${timePart} น.`
}

// A4 Document modal state
const showDocModal = ref(false)
const activeDocBooking = ref(null)
const activeDocType = ref('receipt') // 'receipt' | 'refund'

function openDocumentModal(booking, docType = 'receipt') {
  activeDocBooking.value = booking
  activeDocType.value = docType
  showDocModal.value = true
}

function closeDocumentModal() {
  showDocModal.value = false
  activeDocBooking.value = null
}

function printDocument() {
  window.print()
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
          
          <!-- Email Confirmation Sent Alert Banner -->
          <Transition name="fade">
            <div v-if="showEmailSuccessAlert" class="bg-indigo-50 border-2 border-indigo-300 rounded-2xl p-5 text-indigo-950 flex items-start gap-4 shadow-sm">
              <Send class="w-7 h-7 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h4 class="font-bold text-lg text-indigo-950 mb-1">ส่งลิงก์ยืนยันเรียบร้อยแล้ว!</h4>
                <p class="text-sm sm:text-base font-medium text-indigo-800">
                  ส่งเข้าไปที่อีเมลเรียบร้อย อย่าลืมไปกดรับเพื่อยืนยันการเปลี่ยนแปลงอีเมล
                </p>
              </div>
              <button @click="showEmailSuccessAlert = false" class="text-indigo-700 hover:text-indigo-950 font-bold text-sm cursor-pointer">✕</button>
            </div>
          </Transition>

          <!-- Large Readable Personal Details Card Grid -->
          <div class="bg-white rounded-3xl border border-line p-6 sm:p-10 shadow-sm space-y-8">
            <h2 class="font-display font-bold text-xl sm:text-2xl text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <span>รายละเอียดบัญชีผู้ใช้</span>
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
                  {{ user?.nickname || '-' }}
                </div>
              </div>

              <!-- 3. อีเมล [แก้ไม่ได้ - ปุ่มส่งลิงก์ยืนยัน] -->
              <div class="space-y-2 md:col-span-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <Mail class="w-4 h-4 text-indigo-600" />
                    3. อีเมล (ไม่สามารถพิมพ์แก้ไขโดยตรงได้)
                  </span>
                </label>
                
                <div class="flex flex-col sm:flex-row gap-3">
                  <div class="flex-1 w-full h-14 px-5 bg-slate-100/80 border-2 border-slate-200 rounded-2xl flex items-center text-slate-700 font-bold text-lg select-none cursor-not-allowed">
                    {{ user?.email }}
                  </div>
                  <button
                    @click="requestChangeEmail"
                    type="button"
                    class="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <Send class="w-5 h-5" />
                    <span>ขอเปลี่ยนอีเมล</span>
                  </button>
                </div>
                
                <p class="text-xs font-medium text-slate-400 flex items-center gap-1 pt-1">
                  <Clock class="w-3.5 h-3.5 text-amber-500" />
                  <span>หมายเหตุ: การเปลี่ยนอีเมลต้องผ่านการยืนยันตัวตนจากลิงก์ส่งตรงเข้าอีเมลเดิมของคุณ</span>
                </p>
              </div>

              <!-- 4. เบอร์โทรศัพท์ [แก้ไม่ได้] -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <Phone class="w-4 h-4 text-indigo-600" />
                    4. เบอร์โทรศัพท์
                  </span>
                </label>
                <div class="w-full h-14 px-5 bg-slate-100/80 border-2 border-slate-200 rounded-2xl flex items-center text-slate-700 font-bold text-lg select-none">
                  {{ user?.phone || '081-234-5678' }}
                </div>
              </div>

              <!-- 5. วันเกิด [แก้ไม่ได้] -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <Calendar class="w-4 h-4 text-indigo-600" />
                    5. วันเกิด
                  </span>
                </label>
                <div class="w-full h-14 px-5 bg-slate-100/80 border-2 border-slate-200 rounded-2xl flex items-center text-slate-700 font-bold text-lg select-none">
                  {{ user?.birthdate ? formatDate(user.birthdate) : '15 พ.ค. 2539' }}
                </div>
              </div>

              <!-- 6. อายุ (คำนวณอัตโนมัติ) [แก้ไม่ได้] -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <Cake class="w-4 h-4 text-indigo-600" />
                    6. อายุ (คำนวณจากวันเกิด ปี 2026)
                  </span>
                </label>
                <div class="w-full h-14 px-5 bg-slate-100/80 border-2 border-slate-200 rounded-2xl flex items-center text-slate-700 font-bold text-lg select-none">
                  {{ calculateAge(user?.birthdate || '1996-05-15') }}
                </div>
              </div>

              <!-- 7. บทบาท [แก้ไม่ได้] -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <Shield class="w-4 h-4 text-indigo-600" />
                    7. บทบาทผู้ใช้งาน
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
                    <StatusBadge
                      v-if="shouldShowPaymentBadge(b)"
                      entity="payment"
                      :value="b.paymentStatus"
                      size="sm"
                    />
                  </div>

                  <!-- Room Type Badge -->
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold my-1">
                    <BedDouble class="w-3.5 h-3.5" />
                    <span>ประเภทห้อง: {{ getRoomType(b.hotelId, b.roomId) }} (หมายเลขห้อง {{ b.roomNo }})</span>
                  </div>

                  <p class="text-base font-semibold text-slate-600">
                    วันเข้าพัก: {{ formatDate(b.checkIn) }} → {{ formatDate(b.checkOut) }} · {{ b.nights }} คืน · {{ b.guests }} ท่าน
                  </p>

                  <p class="text-sm font-semibold text-slate-500">
                    วันที่ชำระเงิน: {{ formatDate(b.createdAt) }}
                  </p>

                  <p class="font-display font-bold text-2xl text-indigo-600 tabular-nums pt-1">
                    {{ formatPrice(b.totalPrice) }}
                  </p>

                  <div v-if="refundForBooking(b.id)" class="mt-2 flex items-center gap-2">
                    <span class="text-xs font-semibold text-slate-500">ใบขอคืนเงิน:</span>
                    <StatusBadge entity="refund" :value="refundForBooking(b.id).status" size="sm" />
                  </div>
                </div>

                <!-- Actions & Document Buttons -->
                <div class="flex flex-wrap gap-2 items-center">
                  
                  <!-- Button 1: ใบเสร็จรับเงิน A4 (Receipt) -->
                  <button
                    v-if="b.paymentStatus === 'success' || b.paymentStatus === 'refunded' || b.status === 'confirmed' || b.status === 'completed'"
                    @click="openDocumentModal(b, 'receipt')"
                    type="button"
                    class="h-10 px-4 rounded-full border-2 border-indigo-200 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="ดูใบเสร็จรับเงิน รูปแบบ A4"
                  >
                    <FileText class="w-4 h-4" />
                    <span>ใบเสร็จรับเงิน (A4)</span>
                  </button>

                  <!-- Button 2: ใบคืนเงิน A4 (Refund Paper) -->
                  <button
                    v-if="refundForBooking(b.id) || b.paymentStatus === 'refunded' || b.cancelReason === 'refunded'"
                    @click="openDocumentModal(b, 'refund')"
                    type="button"
                    class="h-10 px-4 rounded-full border-2 border-amber-300 hover:border-amber-500 bg-amber-50 hover:bg-amber-500 text-amber-900 hover:text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="ดูใบแจ้งคืนเงิน รูปแบบ A4"
                  >
                    <RotateCcw class="w-4 h-4" />
                    <span>ใบคืนเงิน (A4)</span>
                  </button>

                  <!-- Button 3: เขียนรีวิวโรงแรม (Review Button for checked-out bookings) -->
                  <button
                    v-if="canReview(b)"
                    @click="openReviewModal(b)"
                    type="button"
                    class="h-10 px-4 rounded-full border-2 border-amber-400 hover:border-amber-500 bg-amber-50/80 hover:bg-amber-400 text-amber-900 hover:text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    :title="getReviewForBooking(b.id) ? 'ดู/แก้ไขรีวิวของคุณ' : 'เขียนรีวิวและให้คะแนนโรงแรม'"
                  >
                    <Star class="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>{{ getReviewForBooking(b.id) ? 'แก้ไขรีวิว' : 'เขียนรีวิวโรงแรม' }}</span>
                  </button>

                  <!-- Button: ชำระเงิน (Proceed to Payment for pending bookings) -->
                  <router-link
                    v-if="b.status === 'pending_payment'"
                    :to="`/booking/${b.hotelId}?roomId=${b.roomId}&bookingId=${b.id}`"
                    class="h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all no-underline shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <CreditCard class="w-4 h-4" />
                    <span>ชำระเงิน</span>
                  </router-link>

                  <BaseButton
                    v-if="b.status === 'pending_payment'"
                    @click="doCancelBooking(b.id)"
                    variant="danger"
                    size="md"
                  >ยกเลิกการจอง</BaseButton>
                  
                  <router-link
                    v-if="canRefund(b)"
                    :to="'/refund-request/' + b.id"
                    class="h-10 px-5 rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold text-sm inline-flex items-center justify-center transition-all no-underline shadow-xs"
                  >
                    <span>ขอคืนเงิน</span>
                  </router-link>
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

    <!-- Review Modal -->
    <BaseModal :open="showReviewModal" @close="showReviewModal = false" title="เขียนรีวิวและให้คะแนนที่พัก">
      <div v-if="reviewBooking" class="flex flex-col gap-4">
        <!-- Hotel & Room Header -->
        <div class="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl">
          <h4 class="font-bold text-base text-slate-900 mb-1">
            {{ getHotelName(reviewBooking.hotelId) }}
          </h4>
          <p class="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
            <BedDouble class="w-3.5 h-3.5" />
            <span>{{ getRoomType(reviewBooking.hotelId, reviewBooking.roomId) }} (หมายเลขห้อง {{ reviewBooking.roomNo }})</span>
          </p>
          <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5 text-slate-400" />
            <span>วันที่เข้าพัก: {{ formatDate(reviewBooking.checkIn) }} — {{ formatDate(reviewBooking.checkOut) }}</span>
          </p>
        </div>

        <!-- Rating Star Selection -->
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">ให้คะแนนที่พัก (คลิกเลือกดาว):</label>
          <div class="flex items-center gap-2 justify-center py-3 bg-amber-50/60 rounded-2xl border border-amber-200">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              @click="reviewRating = star"
              class="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
            >
              <Star
                :class="[
                  'w-8 h-8 transition-colors',
                  star <= reviewRating ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 fill-slate-100'
                ]"
                :stroke-width="1.5"
              />
            </button>
          </div>
          <p class="text-center text-xs font-bold text-amber-700 mt-2">
            {{ reviewRating }} / 5 ดาว ({{ reviewRating === 5 ? 'ดีเยี่ยมที่สุด' : reviewRating === 4 ? 'ดีมาก' : reviewRating === 3 ? 'ปานกลาง' : reviewRating === 2 ? 'พอใช้' : 'ควรปรับปรุง' }})
          </p>
        </div>

        <!-- Comment Input -->
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">ความคิดเห็น / รีวิวเพิ่มเติม:</label>
          <textarea
            v-model="reviewComment"
            rows="4"
            placeholder="ระบุความประทับใจ การบริการ ห้องพัก หรือข้อเสนอแนะสำหรับการเข้าพัก..."
            class="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-base text-slate-900 outline-none focus:border-indigo-600 resize-none font-medium"
          />
        </div>

        <!-- Modal Action Buttons -->
        <div class="flex gap-3 justify-end pt-2">
          <BaseButton @click="showReviewModal = false" variant="ghost" size="md">ยกเลิก</BaseButton>
          <BaseButton @click="submitReview" variant="secondary" size="md" :disabled="!reviewComment.trim()">
            บันทึกรีวิว
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- A4 PDF Document Modal (Receipt & Refund Paper) -->
    <div id="a4-doc-modal-root" v-if="showDocModal && activeDocBooking" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div class="bg-slate-100 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto">
        
        <!-- Top Action Bar (No-Print) -->
        <div class="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 no-print flex-shrink-0">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'p-2.5 rounded-2xl font-bold flex items-center justify-center',
                activeDocType === 'receipt' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
              ]"
            >
              <FileText v-if="activeDocType === 'receipt'" class="w-6 h-6" />
              <RotateCcw v-else class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                <span>{{ activeDocType === 'receipt' ? 'ใบเสร็จรับเงิน (Official Receipt A4)' : 'ใบแจ้งการคืนเงิน (Refund Statement A4)' }}</span>
              </h3>
              <p class="text-xs sm:text-sm text-slate-500 font-medium">
                เลขที่เอกสาร: {{ getDocNumber(activeDocBooking, activeDocType) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="printDocument"
              type="button"
              class="h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Printer class="w-4 h-4" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>

            <button
              @click="closeDocumentModal"
              type="button"
              class="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Scrollable Document View Container -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 flex justify-center">
          
          <!-- A4 Sheet Container -->
          <div
            id="a4-document-printable"
            class="bg-white w-full max-w-[794px] min-h-[1123px] p-8 sm:p-11 border border-slate-300 shadow-xl rounded-xs flex flex-col justify-between font-sans text-slate-800 text-xs relative"
          >
            <!-- Content Top Area -->
            <div>
              <!-- 1. Header Row (Left: Company Details / Right: Document Info Box) -->
              <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div class="flex-1 pr-2">
                  <div class="flex items-baseline gap-2 mb-1">
                    <span class="text-xl font-black tracking-tight text-slate-900 font-display">ADOGA SERVICE</span>
                    <span class="text-xs font-bold text-slate-700">| บริษัท อาโดก้า เซอร์วิส จำกัด (มหาชน)</span>
                  </div>
                  <p class="text-[11px] text-slate-600 leading-snug">
                    123 อาคารอาโดก้า ทาวเวอร์ ชั้น 18 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110
                  </p>
                  <p class="text-[11px] text-slate-500 leading-snug mt-0.5">
                    เลขประจำตัวผู้เสียภาษีอากร: 0105566099881 · โทรศัพท์: 02-123-4567 · เว็บไซต์: www.adoga-service.com
                  </p>
                </div>

                <!-- Right Boxed Table (Matches the reference document box) -->
                <div class="border border-slate-400 text-[11px] w-64 rounded-xs overflow-hidden flex-shrink-0">
                  <table class="w-full border-collapse">
                    <tbody>
                      <tr class="border-b border-slate-300">
                        <td class="bg-slate-100 font-bold px-2.5 py-1 w-24 text-slate-700 border-r border-slate-300">เลขที่เอกสาร:</td>
                        <td class="px-2.5 py-1 font-mono font-bold text-slate-900">{{ getDocNumber(activeDocBooking, activeDocType) }}</td>
                      </tr>
                      <tr class="border-b border-slate-300">
                        <td class="bg-slate-100 font-bold px-2.5 py-1 text-slate-700 border-r border-slate-300">วันที่ออก:</td>
                        <td class="px-2.5 py-1 font-semibold text-slate-800">
                          {{ formatDate(activeDocType === 'receipt' ? activeDocBooking.createdAt : (refundForBooking(activeDocBooking.id)?.createdAt || activeDocBooking.createdAt)) }}
                        </td>
                      </tr>
                      <tr class="border-b border-slate-300">
                        <td class="bg-slate-100 font-bold px-2.5 py-1 text-slate-700 border-r border-slate-300">ผู้ออก:</td>
                        <td class="px-2.5 py-1 text-slate-800">ส่วนกลาง (Admin)</td>
                      </tr>
                      <tr>
                        <td class="bg-slate-100 font-bold px-2.5 py-1 text-slate-700 border-r border-slate-300">รายงาน/ประเภท:</td>
                        <td class="px-2.5 py-1 text-slate-800 font-medium">
                          {{ activeDocType === 'receipt' ? 'ใบเสร็จรับเงิน (e-Receipt)' : 'ใบแจ้งคืนเงิน (e-Refund)' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Thick Dividing Horizontal Rule -->
              <div class="h-0.5 bg-slate-900 my-3.5 w-full"></div>

              <!-- 2. Document Title & Subtitle -->
              <div class="text-center my-2.5">
                <h1 class="text-lg font-bold text-slate-900 tracking-wide">
                  {{ activeDocType === 'receipt' ? 'ใบเสร็จรับเงินและใบกำกับภาษีอย่างย่อ ประจำงวด' : 'ใบแจ้งการคืนเงินและยกเลิกคำขอจอง ประจำงวด' }}
                </h1>
                <p class="text-xs text-slate-500 font-medium mt-0.5">
                  {{ activeDocType === 'receipt' ? '(Official Receipt & Electronic Payment Confirmation Report)' : '(Executive Refund Statement & Cancellation Summary Report)' }}
                </p>
              </div>

              <!-- Sub Metadata Bar -->
              <div class="flex justify-between items-center text-[11px] text-slate-600 mb-3 border-b border-slate-200 pb-1.5">
                <div>
                  <span class="font-bold text-slate-800">เรียน:</span> คุณ {{ user?.firstName }} {{ user?.lastName }} (รหัสผู้ใช้งาน: {{ user?.id }})
                </div>
                <div>
                  <span class="font-bold text-slate-800">เวลาประมวลผล:</span> {{ getDocProcessTime(activeDocType === 'receipt' ? activeDocBooking.createdAt : (refundForBooking(activeDocBooking.id)?.createdAt || activeDocBooking.createdAt)) }}
                </div>
              </div>

              <!-- 3. Section ๑: สรุปข้อมูลการจองและที่พักสำคัญ -->
              <div class="mb-3.5">
                <h2 class="text-xs font-bold text-slate-900 mb-1.5">๑. สรุปข้อมูลการจองและที่พักสำคัญ (Executive Key Indicators Summary)</h2>
                <table class="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr class="bg-slate-100 font-bold text-slate-800 border-b border-slate-400 text-left">
                      <th class="border border-slate-300 py-1.5 px-2 text-center w-12">ลำดับ</th>
                      <th class="border border-slate-300 py-1.5 px-2 w-48">รายการตัวชี้วัด (Key Indicator)</th>
                      <th class="border border-slate-300 py-1.5 px-2 w-48">จำนวน / ข้อมูลจริง</th>
                      <th class="border border-slate-300 py-1.5 px-2">รายละเอียดและข้อมูลจำแนก</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="hover:bg-slate-50/50">
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">1</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">โรงแรมที่พัก (Hotel)</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">{{ getHotelName(activeDocBooking.hotelId) }}</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">
                        {{ getHotel(activeDocBooking.hotelId)?.location || 'ประเทศไทย' }} · หมายเลขการจอง: #{{ activeDocBooking.id }}
                      </td>
                    </tr>
                    <tr class="hover:bg-slate-50/50">
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">2</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">ประเภทห้องพัก (Room Type)</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">{{ getRoomType(activeDocBooking.hotelId, activeDocBooking.roomId) }}</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">
                        ห้องหมายเลข {{ activeDocBooking.roomNo }} · จำนวนผู้เข้าพัก: {{ activeDocBooking.guests }} ท่าน
                      </td>
                    </tr>
                    <tr class="hover:bg-slate-50/50">
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">3</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">ระยะเวลาเข้าพัก (Stay Period)</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">{{ activeDocBooking.nights }} คืน</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">
                        {{ formatDate(activeDocBooking.checkIn) }} ถึง {{ formatDate(activeDocBooking.checkOut) }}
                      </td>
                    </tr>
                    <tr class="hover:bg-slate-50/50">
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">4</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">
                        {{ activeDocType === 'receipt' ? 'ยอดค่าบริการสุทธิ (Total Amount)' : 'ยอดเงินคืนสุทธิ (Refund Amount)' }}
                      </td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-indigo-900">
                        {{ formatPrice(activeDocType === 'receipt' ? activeDocBooking.totalPrice : (refundForBooking(activeDocBooking.id)?.amount || activeDocBooking.totalPrice)) }}
                      </td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">
                        {{ activeDocType === 'receipt' ? `ชำระเงินสำเร็จผ่าน ${activeDocBooking.paymentMethod === 'QR' ? 'PromptPay QR' : 'โอนเงินผ่านธนาคาร'}` : 'คำนวณตามยอดชำระจริงที่ได้รับการอนุมัติ' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 4. Section ๒: รายละเอียดค่าบริการ / การคืนเงิน (Financial Breakdown) -->
              <div class="mb-3.5">
                <h2 class="text-xs font-bold text-slate-900 mb-1.5">
                  {{ activeDocType === 'receipt' ? '๒. รายละเอียดค่าบริการและการชำระเงิน (Revenue & Payment Breakdown)' : '๒. รายละเอียดคำขอคืนเงินและการพิจารณา (Refund Assessment Breakdown)' }}
                </h2>

                <!-- Table for Receipt -->
                <table v-if="activeDocType === 'receipt'" class="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr class="bg-slate-100 font-bold text-slate-800 border-b border-slate-400 text-left">
                      <th class="border border-slate-300 py-1.5 px-2 text-center w-12">ลำดับ</th>
                      <th class="border border-slate-300 py-1.5 px-2">รายการค่าบริการ (Item Description)</th>
                      <th class="border border-slate-300 py-1.5 px-2 text-center w-24">จำนวน (Qty)</th>
                      <th class="border border-slate-300 py-1.5 px-2 text-right w-32">ราคาต่อหน่วย</th>
                      <th class="border border-slate-300 py-1.5 px-2 text-right w-36">จำนวนเงิน (Amount)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">1</td>
                      <td class="border border-slate-300 py-1.5 px-2">
                        <span class="font-bold text-slate-900">ค่าบริการห้องพัก {{ getRoomType(activeDocBooking.hotelId, activeDocBooking.roomId) }}</span>
                        <span class="text-slate-500 block text-[10px]">{{ getHotelName(activeDocBooking.hotelId) }} ({{ activeDocBooking.nights }} คืน)</span>
                      </td>
                      <td class="border border-slate-300 py-1.5 px-2 text-center text-slate-700">{{ activeDocBooking.nights }} คืน</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-right text-slate-700">
                        {{ formatPrice(Math.round(activeDocBooking.totalPrice / (activeDocBooking.nights || 1))) }}
                      </td>
                      <td class="border border-slate-300 py-1.5 px-2 text-right font-bold text-slate-900">
                        {{ formatPrice(activeDocBooking.totalPrice) }}
                      </td>
                    </tr>
                    <tr>
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">2</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-700">ส่วนลดโปรโมชั่นพิเศษ (Promotion Discount)</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-center text-slate-700">1 รายการ</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-right text-slate-700">฿0</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-right font-medium text-slate-700">฿0</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">3</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-700">ค่าบริการระบบและอำนวยความสะดวก (Service Fee)</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-center text-slate-700">1 รายการ</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-right text-slate-700">ฟรี</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-right font-medium text-slate-700">฿0</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Table for Refund -->
                <table v-else class="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr class="bg-slate-100 font-bold text-slate-800 border-b border-slate-400 text-left">
                      <th class="border border-slate-300 py-1.5 px-2 text-center w-12">ลำดับ</th>
                      <th class="border border-slate-300 py-1.5 px-2 w-52">หัวข้อการพิจารณา (Key Assessment)</th>
                      <th class="border border-slate-300 py-1.5 px-2 w-48">ข้อมูลคำร้อง (Application Data)</th>
                      <th class="border border-slate-300 py-1.5 px-2">รายละเอียดและผลการตรวจสอบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">1</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">รหัสคำขอคืนเงิน (Refund ID)</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">RF-{{ refundForBooking(activeDocBooking.id)?.id || activeDocBooking.id }}</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">ยื่นเรื่องผ่านระบบอัตโนมัติ Adoga Service</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">2</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">เหตุผลความประสงค์ (Reason)</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-semibold text-slate-800">
                        {{ refundForBooking(activeDocBooking.id)?.reason || 'เปลี่ยนแผนการเดินทาง' }}
                      </td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">
                        วันที่ยื่นเรื่อง: {{ formatDate(refundForBooking(activeDocBooking.id)?.createdAt || activeDocBooking.createdAt) }}
                      </td>
                    </tr>
                    <tr>
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">3</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">ช่องทางโอนคืน (Refund Channel)</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-800 font-medium">โอนคืนช่องทางเดิมที่ชำระ</td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">ระยะเวลาดำเนินการภายใน 3–5 วันทำการ</td>
                    </tr>
                    <tr>
                      <td class="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-700">4</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold text-slate-900">ผลการพิจารณา (Audit Result)</td>
                      <td class="border border-slate-300 py-1.5 px-2 font-bold" :class="refundForBooking(activeDocBooking.id)?.status === 'approved' ? 'text-emerald-700' : refundForBooking(activeDocBooking.id)?.status === 'rejected' ? 'text-rose-700' : 'text-indigo-700'">
                        {{ refundForBooking(activeDocBooking.id)?.status === 'approved' ? 'อนุมัติการคืนเงิน (Approved)' : refundForBooking(activeDocBooking.id)?.status === 'rejected' ? 'ปฏิเสธคำขอ (Rejected)' : 'อยู่ระหว่างตรวจสอบ (Reviewing)' }}
                      </td>
                      <td class="border border-slate-300 py-1.5 px-2 text-slate-600">
                        {{ refundForBooking(activeDocBooking.id)?.rejectReason ? 'สาเหตุ: ' + refundForBooking(activeDocBooking.id)?.rejectReason : 'ผ่านเกณฑ์ตามเงื่อนไขนโยบายของ Adoga Service' }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- 4-Box Summary Grid underneath (Matches the trend summary bar in the reference image) -->
                <div class="grid grid-cols-4 border border-slate-400 text-[11px] text-center my-2 divide-x divide-slate-400 bg-slate-50">
                  <div class="py-1.5 px-2">
                    <span class="text-slate-500 block text-[10px]">
                      {{ activeDocType === 'receipt' ? 'ราคาก่อนภาษี (Subtotal):' : 'ยอดชำระเดิม (Original):' }}
                    </span>
                    <span class="font-bold text-slate-800">
                      {{ formatPrice(activeDocType === 'receipt' ? Math.round(activeDocBooking.totalPrice * 100 / 107) : activeDocBooking.totalPrice) }}
                    </span>
                  </div>
                  <div class="py-1.5 px-2">
                    <span class="text-slate-500 block text-[10px]">
                      {{ activeDocType === 'receipt' ? 'ภาษีมูลค่าเพิ่ม (VAT 7%):' : 'ค่าธรรมเนียมหัก (Fee):' }}
                    </span>
                    <span class="font-bold text-slate-800">
                      {{ activeDocType === 'receipt' ? formatPrice(activeDocBooking.totalPrice - Math.round(activeDocBooking.totalPrice * 100 / 107)) : '฿0' }}
                    </span>
                  </div>
                  <div class="py-1.5 px-2">
                    <span class="text-slate-500 block text-[10px]">
                      {{ activeDocType === 'receipt' ? 'สถานะการชำระเงิน:' : 'สถานะการคืนเงิน:' }}
                    </span>
                    <span class="font-bold" :class="activeDocType === 'receipt' ? 'text-emerald-700' : (refundForBooking(activeDocBooking.id)?.status === 'approved' ? 'text-emerald-700' : refundForBooking(activeDocBooking.id)?.status === 'rejected' ? 'text-rose-700' : 'text-indigo-700')">
                      {{ activeDocType === 'receipt' ? 'ชำระเงินสำเร็จ (100%)' : (refundForBooking(activeDocBooking.id)?.status === 'approved' ? 'อนุมัติเรียบร้อย' : refundForBooking(activeDocBooking.id)?.status === 'rejected' ? 'ปฏิเสธคำขอ' : 'กำลังดำเนินการ') }}
                    </span>
                  </div>
                  <div class="py-1.5 px-2 bg-indigo-50/50">
                    <span class="text-indigo-950 block text-[10px] font-bold">
                      {{ activeDocType === 'receipt' ? 'ยอดชำระสุทธิ (Total Net):' : 'ยอดเงินคืนสุทธิ (Net Refund):' }}
                    </span>
                    <span class="font-black text-indigo-700 text-sm">
                      {{ formatPrice(activeDocType === 'receipt' ? activeDocBooking.totalPrice : (refundForBooking(activeDocBooking.id)?.amount || activeDocBooking.totalPrice)) }}
                    </span>
                  </div>
                </div>

                <!-- Thai Baht Text Row -->
                <div class="border border-slate-300 bg-slate-100/70 py-1 px-3 text-[11px] text-slate-800 font-medium flex justify-between items-center">
                  <span>
                    <strong>จำนวนเงินตัวอักษร:</strong> ( {{ thaiBahtText(activeDocType === 'receipt' ? activeDocBooking.totalPrice : (refundForBooking(activeDocBooking.id)?.amount || activeDocBooking.totalPrice)) }} )
                  </span>
                  <span class="text-slate-500 text-[10px]">
                    {{ activeDocType === 'receipt' ? 'รวมภาษีมูลค่าเพิ่มเรียบร้อยแล้ว' : 'ยอดเงินคืนสุทธิที่ได้รับการอนุมัติ' }}
                  </span>
                </div>
              </div>

              <!-- 5. Section ๓: ตารางแจกแจงสถานะและนโยบาย (Operational Breakdown Table) -->
              <div class="mb-4">
                <h2 class="text-xs font-bold text-slate-900 mb-1.5">๓. ตารางแจกแจงสถานะและนโยบายการให้บริการ (Operational Breakdown)</h2>
                
                <!-- 2-Column Side-by-Side Table matching section 3 in reference image -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Left Box -->
                  <table class="w-full border-collapse border border-slate-400 text-[10.5px]">
                    <thead>
                      <tr class="bg-slate-100 font-bold text-slate-800 border-b border-slate-400 text-left">
                        <th class="border border-slate-300 py-1 px-2">{{ activeDocType === 'receipt' ? 'สถานะการจอง (Bookings)' : 'ขั้นตอนการคืนเงิน (Refund Steps)' }}</th>
                        <th class="border border-slate-300 py-1 px-2 text-center w-16">จำนวน</th>
                        <th class="border border-slate-300 py-1 px-2 text-center w-16">สัดส่วน</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="border border-slate-300 py-1 px-2 font-medium">
                          {{ activeDocType === 'receipt' ? 'ชำระเงินสำเร็จ (Payment Success)' : 'ตรวจสอบเอกสารและเงื่อนไข' }}
                        </td>
                        <td class="border border-slate-300 py-1 px-2 text-center font-bold">1</td>
                        <td class="border border-slate-300 py-1 px-2 text-center font-bold text-emerald-700">100%</td>
                      </tr>
                      <tr>
                        <td class="border border-slate-300 py-1 px-2 font-medium">
                          {{ activeDocType === 'receipt' ? 'การยืนยันห้องพัก (Confirmed)' : 'การโอนเงินคืนสู่บัญชีผู้ชำระ' }}
                        </td>
                        <td class="border border-slate-300 py-1 px-2 text-center font-bold">1</td>
                        <td class="border border-slate-300 py-1 px-2 text-center font-bold text-emerald-700">100%</td>
                      </tr>
                      <tr class="bg-slate-50 font-bold">
                        <td class="border border-slate-300 py-1 px-2">รวมรายการทั้งหมด</td>
                        <td class="border border-slate-300 py-1 px-2 text-center">1</td>
                        <td class="border border-slate-300 py-1 px-2 text-center">100%</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Right Box -->
                  <table class="w-full border-collapse border border-slate-400 text-[10.5px]">
                    <thead>
                      <tr class="bg-slate-100 font-bold text-slate-800 border-b border-slate-400 text-left">
                        <th class="border border-slate-300 py-1 px-2">{{ activeDocType === 'receipt' ? 'นโยบายและเงื่อนไข (Service Terms)' : 'การจัดการห้องพัก (Room Units)' }}</th>
                        <th class="border border-slate-300 py-1 px-2 text-left w-36">การปฏิบัติตามเกณฑ์</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="border border-slate-300 py-1 px-2 font-medium">
                          {{ activeDocType === 'receipt' ? 'การแสดงหลักฐาน ณ เคาน์เตอร์เช็คอิน' : 'การส่งคืนห้องพักสู่ระบบส่วนกลาง' }}
                        </td>
                        <td class="border border-slate-300 py-1 px-2 text-slate-700 font-semibold">
                          {{ activeDocType === 'receipt' ? 'แสดงเอกสารนี้หรือรหัสจอง' : 'คืนสถานะว่าง (Available)' }}
                        </td>
                      </tr>
                      <tr>
                        <td class="border border-slate-300 py-1 px-2 font-medium">
                          {{ activeDocType === 'receipt' ? 'เวลาเช็คอินและเช็คเอาท์มาตรฐาน' : 'ผลต่อสิทธิ์การเข้าพักเดิม' }}
                        </td>
                        <td class="border border-slate-300 py-1 px-2 text-slate-700 font-semibold">
                          {{ activeDocType === 'receipt' ? 'เช็คอิน 14:00 น. / เช็คเอาท์ 12:00 น.' : 'ยกเลิกสิทธิ์เข้าพักสมบูรณ์' }}
                        </td>
                      </tr>
                      <tr class="bg-slate-50 font-bold">
                        <td class="border border-slate-300 py-1 px-2">การออกใบกำกับภาษี / บัญชี</td>
                        <td class="border border-slate-300 py-1 px-2 text-indigo-700">สมบูรณ์ในระบบอิเล็กทรอนิกส์</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Footer Area: Disclaimer & Signatures & Rubber Stamp -->
            <div class="pt-2 mt-auto">
              <!-- Disclaimer -->
              <p class="text-[10px] text-slate-500 italic mb-4">
                * คำรับรอง: ข้าพเจ้าขอรับรองว่า ข้อมูลธุรกรรมและรายการที่ระบุในเอกสารฉบับนี้ ได้รับการประมวลผลจากฐานข้อมูลระบบ Adoga Service โดยถูกต้องตรงตามความเป็นจริงทุกประการ
              </p>

              <!-- Two Signatures (Prepared By & Approved By) -->
              <div class="grid grid-cols-2 gap-8 text-center text-xs relative mb-3">
                <!-- Left: Prepared By -->
                <div class="space-y-1">
                  <p class="font-bold text-slate-800 mb-8">ผู้จัดทำรายงาน (Prepared By)</p>
                  <p class="text-slate-400 select-none">ลงชื่อ ................................................................</p>
                  <p class="text-slate-700 font-semibold mt-1">( เจ้าหน้าที่แผนกบริการลูกค้า / Customer Support )</p>
                  <p class="text-[10px] text-slate-500">วันที่: ..... / ..... / .........</p>
                </div>

                <!-- Right: Approved By with Official Rubber Stamp -->
                <div class="space-y-1 relative">
                  <p class="font-bold text-slate-800 mb-8">ผู้ตรวจสอบและอนุมัติ (Approved By)</p>

                  <!-- Circular Stamp Overlay exactly like the reference image -->
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-28 pointer-events-none select-none rotate-[-12deg] z-10 flex items-center justify-center">
                    <div class="w-26 h-26 rounded-full border-2 border-dashed border-indigo-600/80 p-1 flex items-center justify-center">
                      <div class="w-full h-full rounded-full border-2 border-indigo-600/80 flex flex-col items-center justify-center text-indigo-700/85 text-[8px] font-black leading-tight tracking-tight uppercase text-center bg-indigo-50/20">
                        <div>★ ★ ★</div>
                        <div class="font-black text-[9px] tracking-wider my-0.5">ADOGA SERVICE</div>
                        <div class="text-[7px] font-bold border-y border-indigo-500/60 w-3/4 py-0.5 my-0.5">OFFICIAL SEAL</div>
                        <div class="text-[6.5px]">AUTHORIZED</div>
                        <div>★ ★ ★</div>
                      </div>
                    </div>
                  </div>

                  <p class="text-slate-400 select-none">ลงชื่อ ................................................................</p>
                  <p class="text-slate-700 font-semibold mt-1">( ผู้อำนวยการฝ่ายปฏิบัติการ / Operations Director )</p>
                  <p class="text-[10px] text-slate-500">วันที่: ..... / ..... / .........</p>
                </div>
              </div>

              <!-- Document Footer Bar -->
              <div class="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                <div>เอกสารนี้ออกโดยระบบอัตโนมัติ Adoga Service · มีผลสมบูรณ์ตามระบบอิเล็กทรอนิกส์</div>
                <div>หน้า ๑ จาก ๑ (Page 1 of 1)</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Footer Pinned to Bottom -->
    <Footer />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 300ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style>
@media print {
  /* Scope to when the user profile document printable is present */
  body:has(#a4-document-printable) * {
    visibility: hidden !important;
  }

  body:has(#a4-document-printable) #a4-document-printable,
  body:has(#a4-document-printable) #a4-document-printable * {
    visibility: visible !important;
  }

  body:has(#a4-document-printable) #a4-document-printable {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
  }

  /* Hide modal buttons and top control action bar */
  .no-print {
    display: none !important;
  }
}
</style>
