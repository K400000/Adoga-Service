<script setup>
// src/views/HotelDetail.vue
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { formatPrice, formatDate } from '../utils/date.js'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import { MapPin, Star, ChevronLeft, MessageCircle, Info, BedDouble, Sparkles } from '@lucide/vue'
import { FALLBACK_IMAGE } from '../constants/images.js'

const route = useRoute()
const router = useRouter()
const { isGuest, isUser } = useSession()

const hotel = computed(() => {
  const hotels = db['adoga_hotels'] || []
  return hotels.find(h => h.id === route.params.id)
})

const reviews = computed(() => {
  if (!hotel.value) return []
  return (db['adoga_reviews'] || []).filter(r => r.hotelId === hotel.value.id)
})

const avgRating = computed(() => {
  if (!reviews.value.length) return hotel.value?.rating || 0
  return reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
})

const amenityIcon = {
  'สระว่ายน้ำ': '🏊', 'WiFi ฟรี': '📶', 'อาหารเช้า': '☕', 'ที่จอดรถ': '🚗',
  'สปา': '💆', 'ฟิตเนส': '🏋️', 'ร้านอาหาร': '🍽️', 'กิจกรรมดำน้ำ': '🤿',
  'หาดส่วนตัว': '🏖️', 'สวนสวย': '🌿',
}

const selectedImg = ref(0)
const activeTab = ref('info')
const TABS = [
  { key: 'info', label: 'ข้อมูลทั่วไป', icon: Info },
  { key: 'rooms', label: 'เลือกห้องพัก', icon: BedDouble },
  { key: 'amenities', label: 'สิ่งอำนวยความสะดวก', icon: Sparkles },
  { key: 'reviews', label: 'รีวิวผู้เข้าพัก', icon: Star },
]

function scrollToSection(key) {
  activeTab.value = key
  const el = document.getElementById(key)
  if (el) {
    const yOffset = -90
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

function bookRoom(room) {
  if (isGuest.value) {
    router.push(`/auth?redirect=/booking/${hotel.value.id}&reason=login_required`)
    return
  }
  if (!isUser.value) return
  router.push(`/booking/${hotel.value.id}?roomId=${room.id}`)
}

function chatHotel() {
  if (isGuest.value) {
    router.push(`/auth?redirect=/messages&reason=login_required`)
    return
  }
  router.push('/messages')
}

const availableCount = (room) => room.units?.filter(u => u.status === 'available').length || 0
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <Navbar />

    <div v-if="!hotel" class="flex flex-col items-center py-24">
      <p class="text-lg font-medium text-ink">ไม่พบที่พักนี้</p>
      <router-link to="/home" class="mt-4 text-indigo-600 hover:underline">กลับหน้าแรก</router-link>
    </div>

    <div v-else class="mx-auto max-w-[1200px] px-4 md:px-8 py-8">
      <!-- Back -->
      <button @click="router.back()" class="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4 transition-colors cursor-pointer">
        <ChevronLeft class="w-4 h-4" :stroke-width="1.75" />
        ย้อนกลับ
      </button>

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="font-display font-semibold text-3xl text-ink mb-2">{{ hotel.name }}</h1>
          <div class="flex flex-wrap items-center gap-3">
            <StatusBadge entity="hotel" :value="hotel.status" />
            <span class="flex items-center gap-1 text-sm text-ink-muted">
              <MapPin class="w-4 h-4" :stroke-width="1.75" />
              {{ hotel.location }}
            </span>
            <span class="flex items-center gap-1 text-sm font-medium text-ink">
              <Star class="w-4 h-4 text-amber-500 fill-amber-400" :stroke-width="1.75" />
              {{ avgRating.toFixed(1) }} ({{ reviews.length }} รีวิว)
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="chatHotel" class="flex items-center gap-2 h-10 px-4 rounded-full border border-line text-sm font-medium text-ink hover:bg-slate-50 transition-colors cursor-pointer">
            <MessageCircle class="w-4 h-4" :stroke-width="1.75" />
            ติดต่อโรงแรม
          </button>
        </div>
      </div>

      <!-- Gallery 8+4 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-8 rounded-3xl overflow-hidden h-80 md:h-96">
        <div class="lg:col-span-8 overflow-hidden">
          <img
            :src="hotel.images?.[selectedImg] || FALLBACK_IMAGE"
            :alt="hotel.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="hidden lg:grid lg:col-span-4 grid-rows-2 gap-3">
          <div
            v-for="(img, i) in hotel.images?.slice(0, 2)"
            :key="i"
            @click="selectedImg = i"
            class="overflow-hidden cursor-pointer rounded-xl"
          >
            <img :src="img" :alt="`${hotel.name} ${i+1}`" class="w-full h-full object-cover hover:opacity-90 transition-opacity" loading="lazy" />
          </div>
        </div>
      </div>

      <!-- Layout 8+4 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Main content: All 4 sections displayed with edge boxes -->
        <div class="lg:col-span-8 flex flex-col gap-6">
          <!-- Sticky Tabs Navigation Bar -->
          <div class="sticky top-20 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-line p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
            <button
              v-for="t in TABS"
              :key="t.key"
              @click="scrollToSection(t.key)"
              :class="[
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer',
                activeTab === t.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-slate-100/80'
              ]"
            >
              <component :is="t.icon" class="w-4 h-4" :stroke-width="1.75" />
              <span>{{ t.label }}</span>
            </button>
          </div>

          <!-- Section 1: ข้อมูลทั่วไป -->
          <section id="info" class="bg-white rounded-3xl border border-line p-6 md:p-8 shadow-xs scroll-mt-28">
            <div class="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Info class="w-4 h-4" :stroke-width="2" />
              </div>
              <h2 class="font-display font-semibold text-xl text-ink">ข้อมูลทั่วไป</h2>
            </div>

            <p class="text-ink leading-relaxed text-base whitespace-pre-line">{{ hotel.description }}</p>

            <div class="mt-6">
              <h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">จุดเด่น & บริการยอดนิยม</h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div v-for="a in hotel.amenities" :key="a" class="flex items-center gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-sm text-ink font-medium">
                  <span class="text-base">{{ amenityIcon[a] || '✓' }}</span>
                  <span>{{ a }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 2: เลือกห้องพัก -->
          <section id="rooms" class="bg-white rounded-3xl border border-line p-6 md:p-8 shadow-xs scroll-mt-28">
            <div class="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center">
                  <BedDouble class="w-4 h-4" :stroke-width="2" />
                </div>
                <h2 class="font-display font-semibold text-xl text-ink">เลือกห้องพัก</h2>
              </div>
              <span class="text-xs font-medium text-ink-muted">พบ {{ hotel.rooms?.length || 0 }} ตัวเลือกห้องพัก</span>
            </div>

            <div class="flex flex-col gap-4">
              <div
                v-for="room in hotel.rooms"
                :key="room.id"
                class="bg-white rounded-2xl border border-line p-4 md:p-5 flex flex-col md:flex-row gap-5 hover:border-slate-300 transition-all shadow-2xs"
              >
                <img
                  :src="hotel.images?.[0] || FALLBACK_IMAGE"
                  :alt="room.type"
                  class="w-full md:w-64 h-40 object-cover rounded-xl flex-shrink-0"
                  loading="lazy"
                />
                <div class="flex-1 flex flex-col justify-between">
                  <div>
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <h3 class="font-display font-semibold text-lg text-ink">{{ room.type }}</h3>
                      <span
                        v-if="availableCount(room) > 0"
                        class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex-shrink-0"
                      >เหลือ {{ availableCount(room) }} ห้อง</span>
                      <span v-else class="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex-shrink-0">เต็ม</span>
                    </div>
                    <p class="text-sm text-ink-muted flex items-center gap-1.5 mb-3">
                      <span>👥 รองรับ {{ room.capacity }} ท่าน</span>
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      <span v-for="u in room.units" :key="u.no">
                        <StatusBadge entity="room" :value="u.status" size="sm" />
                      </span>
                    </div>
                  </div>

                  <div class="flex items-end justify-between mt-4 pt-3 border-t border-slate-100">
                    <div>
                      <p v-if="hotel.discount" class="text-xs text-ink-muted line-through">{{ formatPrice(room.price) }}</p>
                      <div class="flex items-baseline gap-1">
                        <p class="font-display font-bold text-2xl text-ink tabular-nums">
                          {{ formatPrice(Math.round(room.price * (1 - hotel.discount/100))) }}
                        </p>
                        <span class="text-xs text-ink-muted">/ คืน</span>
                      </div>
                    </div>
                    <button
                      @click="bookRoom(room)"
                      :disabled="availableCount(room) === 0 || hotel.status !== 'approved'"
                      :class="[
                        'h-11 px-6 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-xs',
                        availableCount(room) > 0 && hotel.status === 'approved'
                          ? 'bg-coral-600 text-white hover:bg-coral-700 active:scale-95'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      ]"
                    >
                      {{ hotel.status === 'suspended' ? 'ปิดชั่วคราว' : availableCount(room) === 0 ? 'เต็ม' : 'จองห้องพัก' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 3: สิ่งอำนวยความสะดวก -->
          <section id="amenities" class="bg-white rounded-3xl border border-line p-6 md:p-8 shadow-xs scroll-mt-28">
            <div class="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
              <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles class="w-4 h-4" :stroke-width="2" />
              </div>
              <h2 class="font-display font-semibold text-xl text-ink">สิ่งอำนวยความสะดวก</h2>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div v-for="a in hotel.amenities" :key="a" class="flex items-center gap-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                <span class="text-2xl">{{ amenityIcon[a] || '✓' }}</span>
                <span class="text-sm font-medium text-ink">{{ a }}</span>
              </div>
            </div>
          </section>

          <!-- Section 4: รีวิวผู้เข้าพัก -->
          <section id="reviews" class="bg-white rounded-3xl border border-line p-6 md:p-8 shadow-xs scroll-mt-28">
            <div class="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Star class="w-4 h-4 fill-emerald-600 text-emerald-600" :stroke-width="1.75" />
                </div>
                <h2 class="font-display font-semibold text-xl text-ink">รีวิวผู้เข้าพัก</h2>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-200 text-xs font-semibold text-amber-900">
                <Star class="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>{{ avgRating.toFixed(1) }} / 5.0</span>
                <span class="text-amber-700">({{ reviews.length }} รีวิว)</span>
              </div>
            </div>

            <div v-if="!reviews.length" class="py-12 text-center text-ink-muted">
              <p class="text-sm font-medium">ยังไม่มีรีวิวสำหรับโรงแรมนี้</p>
              <p class="text-xs text-slate-400 mt-1">รับประสบการณ์การเข้าพักและเป็นคนแรกที่รีวิวที่นี่</p>
            </div>

            <div v-else class="flex flex-col gap-4">
              <div v-for="r in reviews" :key="r.id" class="bg-slate-50/70 rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div class="flex items-center gap-3 mb-2.5">
                  <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 shadow-2xs">
                    {{ r.userId.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-ink">{{ r.userId }}</p>
                    <p class="text-xs text-ink-muted">{{ formatDate(r.date) }}</p>
                  </div>
                  <div class="ml-auto flex items-center gap-0.5">
                    <Star v-for="i in 5" :key="i" :class="['w-4 h-4', i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200']" :stroke-width="1.75" />
                  </div>
                </div>
                <p class="text-sm text-ink leading-relaxed">{{ r.comment }}</p>
              </div>
            </div>
          </section>
        </div>

        <!-- Sticky booking sidebar -->
        <div class="lg:col-span-4">
          <div class="sticky top-24 bg-white rounded-2xl border border-line p-6 shadow-xs">
            <p class="text-xs text-ink-muted mb-1">ราคาเริ่มต้น</p>
            <div class="flex items-end gap-2 mb-4">
              <p v-if="hotel.discount" class="text-sm text-ink-muted line-through">{{ formatPrice(hotel.pricePerNight) }}</p>
              <p class="font-display font-semibold text-3xl text-ink tabular-nums">
                {{ formatPrice(Math.round(hotel.pricePerNight * (1 - hotel.discount/100))) }}
              </p>
              <p class="text-sm text-ink-muted pb-1">/ คืน</p>
            </div>

            <div v-if="hotel.status === 'suspended'" class="mb-4 p-3 rounded-xl bg-slate-100 text-sm text-slate-600">
              ⏸ โรงแรมปิดชั่วคราว ไม่รับการจอง
            </div>

            <button
              v-else
              @click="scrollToSection('rooms')"
              class="w-full h-12 rounded-full bg-coral-600 text-white font-medium text-base hover:bg-coral-700 transition-colors cursor-pointer shadow-xs"
            >
              เลือกห้องพักตอนนี้
            </button>

            <div class="mt-4 flex flex-col gap-2 text-sm text-ink-muted">
              <p class="flex items-center gap-2">✓ ยกเลิกฟรีสำหรับแผนที่ระบุ</p>
              <p class="flex items-center gap-2">✓ ราคารับประกันดีที่สุด</p>
              <p class="flex items-center gap-2">✓ ปลอดภัย ชำระเงินผ่านระบบ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>
