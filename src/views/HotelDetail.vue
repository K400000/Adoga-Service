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
import { MapPin, Star, Wifi, Coffee, Car, Dumbbell, Waves, ChevronLeft, MessageCircle, Phone } from '@lucide/vue'
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
  { key: 'info', label: 'ข้อมูลทั่วไป' },
  { key: 'rooms', label: 'เลือกห้องพัก' },
  { key: 'amenities', label: 'สิ่งอำนวยความสะดวก' },
  { key: 'reviews', label: 'รีวิวผู้เข้าพัก' },
]

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
      <button @click="router.back()" class="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4 transition-colors">
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
          <button @click="chatHotel" class="flex items-center gap-2 h-10 px-4 rounded-full border border-line text-sm font-medium text-ink hover:bg-slate-50 transition-colors">
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
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-8">
          <!-- Tabs -->
          <div class="flex border-b border-line mb-6 overflow-x-auto">
            <button
              v-for="t in TABS" :key="t.key"
              @click="activeTab = t.key"
              :class="[
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                activeTab === t.key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-ink-muted hover:text-ink'
              ]"
            >{{ t.label }}</button>
          </div>

          <!-- Info tab -->
          <div v-if="activeTab === 'info'">
            <p class="text-ink leading-relaxed max-w-[640px]">{{ hotel.description }}</p>
            <div class="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div v-for="a in hotel.amenities" :key="a" class="flex items-center gap-2 p-3 bg-white rounded-xl border border-line text-sm text-ink">
                <span>{{ amenityIcon[a] || '✓' }}</span>
                {{ a }}
              </div>
            </div>
          </div>

          <!-- Rooms tab -->
          <div v-if="activeTab === 'rooms'" class="flex flex-col gap-4">
            <div
              v-for="room in hotel.rooms"
              :key="room.id"
              class="bg-white rounded-2xl border border-line p-4 flex flex-col md:flex-row gap-4"
            >
              <img
                :src="hotel.images?.[0] || FALLBACK_IMAGE"
                :alt="room.type"
                class="w-full md:w-60 h-36 object-cover rounded-xl flex-shrink-0"
                loading="lazy"
              />
              <div class="flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <h3 class="font-display font-semibold text-lg text-ink">{{ room.type }}</h3>
                    <span
                      v-if="availableCount(room) > 0"
                      class="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full ring-1 ring-emerald-200 flex-shrink-0"
                    >เหลือ {{ availableCount(room) }} ห้อง</span>
                    <span v-else class="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded-full ring-1 ring-rose-200 flex-shrink-0">เต็ม</span>
                  </div>
                  <p class="text-sm text-ink-muted">รองรับ {{ room.capacity }} ท่าน</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <span v-for="u in room.units" :key="u.no">
                      <StatusBadge entity="room" :value="u.status" size="sm" />
                    </span>
                  </div>
                </div>
                <div class="flex items-end justify-between mt-4">
                  <div>
                    <p v-if="hotel.discount" class="text-sm text-ink-muted line-through">{{ formatPrice(room.price) }}</p>
                    <p class="font-display font-semibold text-2xl text-ink tabular-nums">
                      {{ formatPrice(Math.round(room.price * (1 - hotel.discount/100))) }}
                    </p>
                    <p class="text-xs text-ink-muted">/ คืน</p>
                  </div>
                  <button
                    @click="bookRoom(room)"
                    :disabled="availableCount(room) === 0 || hotel.status !== 'approved'"
                    :class="[
                      'h-11 px-6 rounded-full text-sm font-medium transition-colors',
                      availableCount(room) > 0 && hotel.status === 'approved'
                        ? 'bg-coral-600 text-white hover:bg-coral-700'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    ]"
                  >
                    {{ hotel.status === 'suspended' ? 'ปิดชั่วคราว' : availableCount(room) === 0 ? 'เต็ม' : 'จองห้องพัก' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Amenities tab -->
          <div v-if="activeTab === 'amenities'" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="a in hotel.amenities" :key="a" class="flex items-center gap-3 p-4 bg-white rounded-2xl border border-line">
              <span class="text-2xl">{{ amenityIcon[a] || '✓' }}</span>
              <span class="text-sm font-medium text-ink">{{ a }}</span>
            </div>
          </div>

          <!-- Reviews tab -->
          <div v-if="activeTab === 'reviews'" class="flex flex-col gap-4">
            <div v-if="!reviews.length" class="py-8 text-center text-ink-muted">ยังไม่มีรีวิว</div>
            <div v-for="r in reviews" :key="r.id" class="bg-white rounded-2xl border border-line p-4">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
                  {{ r.userId.charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-medium text-ink">{{ r.userId }}</p>
                  <p class="text-xs text-ink-muted">{{ formatDate(r.date) }}</p>
                </div>
                <div class="ml-auto flex items-center gap-0.5">
                  <Star v-for="i in 5" :key="i" :class="['w-4 h-4', i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200']" :stroke-width="1.75" />
                </div>
              </div>
              <p class="text-sm text-ink leading-relaxed">{{ r.comment }}</p>
            </div>
          </div>
        </div>

        <!-- Sticky booking sidebar -->
        <div class="lg:col-span-4">
          <div class="sticky top-24 bg-white rounded-2xl border border-line p-6">
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
              @click="activeTab = 'rooms'"
              class="w-full h-12 rounded-full bg-coral-600 text-white font-medium text-base hover:bg-coral-700 transition-colors"
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
