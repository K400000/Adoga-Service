<script setup>
// src/views/RefundRequest.vue — Refund Request page matching UI specs 14-01 & 14-02
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { requestRefund } from '../services/transitions.js'
import { formatPrice, formatDate } from '../utils/date.js'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import BaseModal from '../components/common/BaseModal.vue'
import BaseButton from '../components/common/BaseButton.vue'
import {
  ShieldCheck, ArrowLeft, CheckCircle2, Clock,
  CreditCard, Wallet, Landmark, PhoneCall, MessageSquare,
  Lock, AlertCircle, FileText, ChevronRight, Check, MapPin
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { session } = useSession()

const bookingId = computed(() => route.params.bookingId)

const booking = computed(() => {
  const list = db['adoga_bookings'] || []
  return list.find(b => b.id === bookingId.value)
})

const hotel = computed(() => {
  if (!booking.value) return null
  const hotels = db['adoga_hotels'] || []
  return hotels.find(h => h.id === booking.value.hotelId)
})

const room = computed(() => {
  if (!hotel.value || !booking.value) return null
  return hotel.value.rooms?.find(r => r.id === booking.value.roomId)
})

const user = computed(() => {
  const users = db['adoga_users'] || []
  return users.find(u => u.id === session.value?.userId)
})

// Options state
const selectedReason = ref('เปลี่ยนแผนการเดินทาง')
const extraReasonText = ref('')
const selectedChannel = ref('original') // 'original', 'bank'

const agreePolicy1 = ref(true)
const agreePolicy2 = ref(true)

const showSuccessModal = ref(false)

// Reason options mapping
const reasonsList = [
  { id: 'เปลี่ยนแผนการเดินทาง', title: 'เปลี่ยนแผนการเดินทาง', desc: 'ตารางเวลาหรือแผนงานมีการเปลี่ยนแปลง', icon: '✈️' },
  { id: 'เหตุฉุกเฉิน / ปัญหาสุขภาพ', title: 'เหตุฉุกเฉิน / ปัญหาสุขภาพ', desc: 'เจ็บป่วยกะทันหัน หรือมีภารกิจจำเป็น', icon: '🏥' },
  { id: 'จองวันหรือห้องพักผิดพลาด', title: 'จองวันหรือห้องพักผิดพลาด', desc: 'ต้องการจองวันอื่นหรือเปลี่ยนประเภทห้อง', icon: '📅' },
  { id: 'สภาพอากาศ / การเดินทาง', title: 'สภาพอากาศ / การเดินทาง', desc: 'สภาพอากาศติดขัด มรสุม หรือการเดินทางล่าช้า', icon: '🌧️' },
  { id: 'พบที่พักอื่นที่ตอบโจทย์กว่า', title: 'พบที่พักอื่นที่ตอบโจทย์กว่า', desc: 'ตัดสินใจเลือกที่พักหรือแพ็กเกจใหม่', icon: '🏨' },
  { id: 'เหตุผลอื่นๆ', title: 'เหตุผลอื่นๆ', desc: 'ระบุรายละเอียดเพิ่มเติมด้วยตนเอง', icon: '✏️' },
]

// Financial calculations
const originalAmount = computed(() => booking.value?.totalPrice || 0)
const finalRefundAmount = computed(() => originalAmount.value)

const canSubmit = computed(() => {
  return selectedReason.value && agreePolicy1.value && agreePolicy2.value && booking.value
})

function submitRefundForm() {
  if (!canSubmit.value) return

  const fullReasonText = selectedReason.value + (extraReasonText.value.trim() ? ` (${extraReasonText.value.trim()})` : '')
  
  requestRefund({
    bookingId: booking.value.id,
    userId: session.value?.userId,
    hotelId: booking.value.hotelId,
    amount: finalRefundAmount.value,
    reason: `[ช่องทาง: ${selectedChannel.value}] ${fullReasonText}`
  })

  showSuccessModal.value = true
}

function handleDone() {
  showSuccessModal.value = false
  router.push('/profile')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-between w-full overflow-x-hidden font-sans text-slate-800">
    <div class="w-full flex-1 flex flex-col justify-start">
      <Navbar />

      <main class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-8 flex-1">
        
        <!-- Top Navigation / Breadcrumb -->
        <div class="mb-6 flex items-center justify-between">
          <router-link
            to="/profile"
            class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-base transition-colors no-underline group"
          >
            <ArrowLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>ย้อนกลับไปหน้าโปรไฟล์</span>
          </router-link>
        </div>

        <!-- Page Header Banner -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                <ShieldCheck class="w-7 h-7" />
              </span>
              <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
                ยื่นคำขอคืนเงินและยกเลิกการจอง
              </h1>
            </div>
            <p class="text-slate-500 font-medium text-base ml-12">
              รหัสการจอง: <span class="font-bold text-slate-700">{{ booking?.id || '—' }}</span>
              <span class="mx-2">·</span>
              ผู้เข้าพัก: <span class="font-bold text-slate-700">{{ user?.firstName }} {{ user?.lastName }}</span>
            </p>
          </div>

          <div class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs sm:text-sm font-bold flex-shrink-0">
            <ShieldCheck class="w-5 h-5 text-sky-600" />
            <span>SIAMVOYAGE BUYER PROTECTION คุ้มครองคืนเงินปลอดภัย 100%</span>
          </div>
        </div>

        <!-- Stepper Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="flex items-center justify-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm">
              <span class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold">1</span>
              <span>1. เลือกเหตุผล & ตรวจสอบยอด</span>
            </div>
            <div class="flex items-center justify-center gap-3 p-3 rounded-xl bg-slate-100 text-slate-500 font-medium text-sm">
              <span class="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>2. ยืนยันคำขอ & บัญชีรับเงิน</span>
            </div>
            <div class="flex items-center justify-center gap-3 p-3 rounded-xl bg-slate-100 text-slate-500 font-medium text-sm">
              <span class="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold">3</span>
              <span>3. ดำเนินการ & รับเงินคืน</span>
            </div>
          </div>
        </div>

        <div v-if="!booking" class="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <AlertCircle class="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 class="text-xl font-bold text-slate-900 mb-2">ไม่พบข้อมูลรายการจอง</h2>
          <p class="text-slate-500 mb-6">ไม่พบรหัสการจองที่คุณระบุ หรือรายการจองถูกยกเลิกแล้ว</p>
          <router-link to="/profile" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold no-underline">
            กลับไปยังหน้าโปรไฟล์
          </router-link>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT COLUMN: Main Form -->
          <div class="lg:col-span-8 space-y-8">

            <!-- Hotel Summary Card -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row gap-6">
              <img
                :src="hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'"
                alt="Hotel"
                class="w-full sm:w-44 h-36 object-cover rounded-2xl border border-slate-100 flex-shrink-0"
              />
              <div class="flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-display font-bold text-xl text-slate-900">{{ hotel?.name }}</h3>
                  <span class="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ ยืนยันแล้ว (จองสำเร็จ)
                  </span>
                </div>
                <p class="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                  <MapPin class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>{{ hotel?.location }}</span>
                </p>
                <div class="pt-2 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 font-medium">
                  <p>ประเภทห้อง: <strong class="text-slate-800">{{ room?.type || 'Standard Room' }}</strong></p>
                  <p>เข้าพัก: <strong class="text-slate-800">{{ formatDate(booking.checkIn) }} – {{ formatDate(booking.checkOut) }}</strong></p>
                  <p>ผู้เข้าพัก: <strong class="text-slate-800">{{ booking.guests }} ท่าน ({{ booking.nights }} คืน)</strong></p>
                </div>
                <div class="pt-2 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">ยอดที่ชำระไปแล้วทั้งสิ้น:</span>
                  <span class="font-display font-bold text-2xl text-indigo-600">{{ formatPrice(booking.totalPrice) }}</span>
                </div>
              </div>
            </div>

            <!-- Free Cancellation Banner -->
            <div class="bg-indigo-900/5 border-2 border-indigo-200 rounded-3xl p-6 relative overflow-hidden">
              <div class="flex items-start gap-4">
                <div class="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                  <ShieldCheck class="w-7 h-7" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-bold text-lg text-indigo-950">
                      ยกเลิกฟรีตามนโยบายโรงแรม (Free Cancellation Guarantee)
                    </h4>
                    <span class="px-2.5 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-extrabold">
                      คืนเงิน 100%
                    </span>
                  </div>
                  <p class="text-sm text-indigo-900 font-medium leading-relaxed mb-2">
                    คุณกำลังส่งคำขอก่อนกำหนดเวลาสิ้นสุดของการจอง ระบบจะดำเนินการคืนเงินเต็มจำนวน <strong class="text-indigo-950 font-bold underline">{{ formatPrice(booking.totalPrice) }}</strong> โดยไม่มีค่าปรับหรือค่าธรรมเนียมใดๆ แอบแฝง
                  </p>
                  <p class="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                    <Clock class="w-4 h-4 text-amber-500" />
                    <span>เหลือเวลาสำหรับการยกเลิกฟรีอีก: 3 วัน 14 ชั่วโมง</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- SECTION 1: Reason for Cancellation -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 class="font-display font-bold text-xl text-slate-900 flex items-center gap-3">
                  <span class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-extrabold">1</span>
                  <span>เหตุผลในการขอยกเลิกการจอง</span>
                </h3>
                <span class="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  จำต้องระบุ
                </span>
              </div>

              <!-- Reason Radio Cards Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  v-for="r in reasonsList"
                  :key="r.id"
                  @click="selectedReason = r.id"
                  :class="[
                    'p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4',
                    selectedReason === r.id
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <div class="pt-0.5">
                    <input
                      type="radio"
                      :value="r.id"
                      v-model="selectedReason"
                      class="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <h5 class="font-bold text-base text-slate-900 mb-0.5 flex items-center gap-1.5">
                      <span>{{ r.icon }}</span>
                      <span>{{ r.title }}</span>
                    </h5>
                    <p class="text-xs text-slate-500 font-medium leading-normal">{{ r.desc }}</p>
                  </div>
                </div>
              </div>

              <!-- Extra Explanation Textarea -->
              <div class="space-y-2 pt-2">
                <label class="text-sm font-bold text-slate-700 block">
                  คำอธิบายเพิ่มเติม (ไม่บังคับ)
                </label>
                <textarea
                  v-model="extraReasonText"
                  rows="3"
                  placeholder="ระบุข้อความอธิบายให้ทางทีมงานทราบเพิ่มเติม เช่น เอกสารแพทย์ หรือเหตุการณ์อื่นๆ..."
                  class="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 text-sm outline-none focus:border-indigo-600 transition-colors resize-none font-medium"
                />
              </div>
            </div>

            <!-- SECTION 2: Refund Channel Selection -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 class="font-display font-bold text-xl text-slate-900 flex items-center gap-3">
                  <span class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-extrabold">2</span>
                  <span>เลือกช่องทางการรับเงินคืน</span>
                </h3>
                <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  เลือกได้ 1 ช่องทาง
                </span>
              </div>

              <div class="space-y-4">

                <!-- Channel 2: Original Payment Method -->
                <div
                  @click="selectedChannel = 'original'"
                  :class="[
                    'p-6 rounded-2xl border-2 transition-all cursor-pointer',
                    selectedChannel === 'original'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <div class="flex items-start gap-4">
                    <input
                      type="radio"
                      value="original"
                      v-model="selectedChannel"
                      class="w-5 h-5 mt-1 accent-indigo-600 cursor-pointer"
                    />
                    <div class="flex-1 space-y-1">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <CreditCard class="w-5 h-5 text-indigo-600" />
                          <h4 class="font-bold text-lg text-slate-900">คืนเงินผ่านช่องทางเดิมที่ชำระ</h4>
                        </div>
                        <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          3-5 วันทำการ
                        </span>
                      </div>
                      <p class="text-xs sm:text-sm text-slate-600 font-medium">
                        เงินจะถูกโอนกลับเข้าบัตรเครดิต/เดบิต หรือ บัญชีพร้อมเพย์ที่ท่านใช้ชำระเงิน ยอดเต็มจำนวน <strong class="text-slate-800 font-bold">{{ formatPrice(originalAmount) }}</strong>
                      </p>
                      <p class="text-xs text-slate-400 font-medium pt-1">
                        💳 บัตรเครดิต Visa ลงท้าย **** 4892 (ธนาคารกสิกรไทย) / PromptPay
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Channel 3: Thai Bank Transfer -->
                <div
                  @click="selectedChannel = 'bank'"
                  :class="[
                    'p-6 rounded-2xl border-2 transition-all cursor-pointer',
                    selectedChannel === 'bank'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <div class="flex items-start gap-4">
                    <input
                      type="radio"
                      value="bank"
                      v-model="selectedChannel"
                      class="w-5 h-5 mt-1 accent-indigo-600 cursor-pointer"
                    />
                    <div class="flex-1 space-y-1">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <Landmark class="w-5 h-5 text-indigo-600" />
                          <h4 class="font-bold text-lg text-slate-900">โอนผ่านบัญชีธนาคารในประเทศไทย</h4>
                        </div>
                        <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          2-3 วันทำการ
                        </span>
                      </div>
                      <p class="text-xs sm:text-sm text-slate-600 font-medium">
                        สำหรับกรณีต้องการโอนเข้าบัญชีออมทรัพย์หรือกระแสรายวันใหม่ โดยระบุชื่อบัญชีตรงกับชื่อผู้จอง
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- SECTION 3: Terms & Agreement (Ref: 14-01-money-back.png) -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 class="font-display font-bold text-xl text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-extrabold">3</span>
                <span>เงื่อนไขและการรับทราบ (PDPA & Policy)</span>
              </h3>

              <div class="space-y-3 pt-2">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    v-model="agreePolicy1"
                    class="w-5 h-5 mt-0.5 accent-indigo-600 rounded-md cursor-pointer"
                  />
                  <span class="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                    ข้าพเจ้ารับทราบว่าเมื่อส่งคำขอแล้ว ห้องพักจะถูกยกเลิกทันที และไม่สามารถกู้คืนหรือกลับเข้าพักตามวันดังกล่าวได้อีก
                  </span>
                </label>

                <label class="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    v-model="agreePolicy2"
                    class="w-5 h-5 mt-0.5 accent-indigo-600 rounded-md cursor-pointer"
                  />
                  <span class="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                    ยินยอมให้ SiamVoyage ประมวลผลข้อมูลส่วนบุคคลและข้อมูลทางการเงินเพื่อวัตถุประสงค์ในการทำรายการคืนเงินตามกฎหมาย PDPA
                  </span>
                </label>
              </div>
            </div>

          </div>


          <!-- RIGHT COLUMN: Sidebar Refund Summary -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

            <!-- Summary Card -->
            <div class="bg-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden border border-indigo-900">
              <div class="flex items-center justify-between border-b border-indigo-800/80 pb-4">
                <div>
                  <h3 class="font-display font-extrabold text-xl text-white">สรุปยอดเงินคืน</h3>
                  <p class="text-xs text-indigo-300 font-medium">คำนวณตามนโยบาย SLA อัตโนมัติ</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-800 text-indigo-200 border border-indigo-700">
                  รับประกันยอดคืน
                </span>
              </div>

              <!-- Price Breakdown Table -->
              <div class="space-y-3 text-sm font-medium">
                <div class="flex justify-between text-indigo-200">
                  <span>ยอดเงินที่ชำระไว้เดิม</span>
                  <span class="font-bold text-white">{{ formatPrice(originalAmount) }}</span>
                </div>
                <div class="flex justify-between text-indigo-300">
                  <span>หัก ค่าธรรมเนียมโรงแรม</span>
                  <span class="font-bold text-emerald-400">-฿0 (ฟรี)</span>
                </div>
                <div class="flex justify-between text-indigo-300">
                  <span>หัก ค่าธรรมเนียม SiamVoyage</span>
                  <span class="font-bold text-emerald-400">-฿0 (ฟรี)</span>
                </div>
              </div>

              <!-- Net Refund Highlight Box -->
              <div class="bg-indigo-900/90 rounded-2xl p-5 border border-indigo-700 space-y-1">
                <span class="text-xs font-bold uppercase tracking-wider text-indigo-300">ยอดสุทธิที่จะได้รับคืน</span>
                <div class="flex items-baseline justify-between">
                  <span class="font-display font-extrabold text-3xl sm:text-4xl text-white">
                    {{ formatPrice(finalRefundAmount) }}
                  </span>
                  <span class="px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-full">
                    100% (เต็มจำนวน)
                  </span>
                </div>
                <p class="text-xs text-indigo-300 font-medium pt-1">
                  {{ selectedChannel === 'bank' ? 'โอนเข้าบัญชีธนาคารในประเทศไทย' : 'เข้าบัญชีเดิมที่ใช้ชำระเงิน' }}
                </p>
              </div>

              <!-- SLA Steps Timeline -->
              <div class="space-y-3 border-t border-indigo-800/80 pt-4">
                <p class="text-xs font-bold text-indigo-300 uppercase tracking-wider">ลำดับขั้นตอนการรับเงินคืน</p>
                <div class="space-y-2 text-xs font-medium text-indigo-200">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-[10px]">1</span>
                    <span><strong>ส่งคำขอคืนเงิน</strong> (วันนี้ - ทำรายการสำเร็จทันที)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-indigo-700 text-indigo-200 flex items-center justify-center font-extrabold text-[10px]">2</span>
                    <span><strong>อนุมัติคำขออัตโนมัติ</strong> (ระบบตรวจสอบไม่เกิน 2-4 ชั่วโมง)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-indigo-700 text-indigo-200 flex items-center justify-center font-extrabold text-[10px]">3</span>
                    <span><strong>เงินเข้าบัญชีปลายทาง</strong> (ภายใน 5-15 นาที)</span>
                  </div>
                </div>
              </div>

              <!-- Main Action Buttons -->
              <div class="space-y-3 pt-2">
                <button
                  @click="submitRefundForm"
                  :disabled="!canSubmit"
                  :class="[
                    'w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer',
                    canSubmit
                      ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-indigo-950 shadow-emerald-500/20'
                      : 'bg-indigo-800 text-indigo-400 cursor-not-allowed'
                  ]"
                >
                  <span>ยืนยันและส่งคำขอคืนเงิน</span>
                  <ChevronRight class="w-5 h-5" />
                </button>

                <router-link
                  to="/profile"
                  class="w-full h-11 rounded-2xl border border-indigo-700 hover:bg-indigo-900 text-indigo-200 hover:text-white font-bold text-sm flex items-center justify-center transition-colors no-underline"
                >
                  <span>เปลี่ยนใจไม่ขอยกเลิก (กลับไปยังการจอง)</span>
                </router-link>
              </div>

              <p class="text-[11px] text-center text-indigo-400 font-medium flex items-center justify-center gap-1">
                <Lock class="w-3 h-3 text-indigo-300" />
                <span>ระบบความปลอดภัย SSL 256-Bit เข้ารหัสข้อมูลรูปแบบใหม่</span>
              </p>
            </div>

            <!-- Help & Support Card -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div class="flex items-center gap-3">
                <span class="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                  <PhoneCall class="w-5 h-5" />
                </span>
                <h4 class="font-bold text-base text-slate-900">ต้องการความช่วยเหลือเพิ่มเติม?</h4>
              </div>
              <p class="text-xs text-slate-500 font-medium leading-relaxed">
                หากคุณต้องการเลื่อนวันเดินทางโดยไม่ต้องยกเลิก หรือมีข้อสงสัยเกี่ยวกับนโยบาย ติดต่อเจ้าหน้าที่บริการลูกค้าได้ตลอด 24 ชั่วโมง
              </p>
              <div class="space-y-2 pt-1 text-sm font-bold">
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-800">
                  <span>📞 สายด่วน: 02-789-9999</span>
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">โทรฟรี</span>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-indigo-600">
                  <span class="flex items-center gap-2">
                    <MessageSquare class="w-4 h-4" />
                    <span>แชทสดกับเจ้าหน้าที่ SiamVoyage</span>
                  </span>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>

    <!-- Success Refund Modal -->
    <BaseModal :open="showSuccessModal" @close="handleDone" title="ส่งคำขอคืนเงินสำเร็จ">
      <div class="text-center space-y-4 py-4">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 class="w-10 h-10" />
        </div>
        <div>
          <h3 class="text-2xl font-bold text-slate-900 mb-1">ส่งคำขอคืนเงินเรียบร้อยแล้ว!</h3>
          <p class="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            ระบบได้รับคำขอคืนเงินของรหัสการจอง <strong class="text-slate-900">{{ booking?.id }}</strong> เรียบร้อยแล้ว ยอดเงินสุทธิ <strong class="text-indigo-600 font-bold text-base">{{ formatPrice(finalRefundAmount) }}</strong> จะดำเนินการโอนเข้าช่องทางที่คุณเลือกโดยเร็วที่สุด
          </p>
        </div>
        <div class="pt-4">
          <BaseButton @click="handleDone" variant="primary" size="lg" class="w-full">
            ตกลง (กลับไปยังโปรไฟล์)
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <Footer />
  </div>
</template>

<style scoped>
</style>
