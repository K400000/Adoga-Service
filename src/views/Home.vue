<script setup>
// src/views/Home.vue
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import HotelCard from '../components/common/HotelCard.vue'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import { Search, MapPin, Calendar, Users } from '@lucide/vue'

const router = useRouter()
const { isGuest } = useSession()

const searchQuery = ref('')
const filterLocation = ref('all')

const activeHotels = computed(() => {
  const hotels = db['adoga_hotels'] || []
  return hotels.filter(h => h.status === 'approved')
})

const filteredHotels = computed(() => {
  let list = activeHotels.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(h => h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q))
  }
  if (filterLocation.value !== 'all') {
    list = list.filter(h => h.location.includes(filterLocation.value))
  }
  return list
})

const locations = computed(() => {
  const locs = [...new Set(activeHotels.value.map(h => h.location.split(',')[1]?.trim() || h.location))]
  return ['all', ...locs]
})

const featuredHotel = computed(() => activeHotels.value.find(h => h.rating >= 4.5) || activeHotels.value[0])

function doSearch() {
  // filter is reactive already
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <Navbar />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-indigo-900" style="aspect-ratio:21/9; min-height:300px; max-height:520px;">
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
        alt="วิวทะเลและธรรมชาติประเทศไทย"
        class="w-full h-full object-cover opacity-60"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
      <div class="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <h1 class="font-display font-semibold text-white text-3xl md:text-5xl mb-3 leading-tight" style="text-shadow:0 2px 12px rgba(0,0,0,.4)">
          ค้นหาที่พักและโรงแรมยอดนิยมทั่วไทย
        </h1>
        <p class="text-white/90 text-sm md:text-base mb-6 max-w-2xl font-light">
          ชลบุรี · เชียงใหม่ · ภูเก็ต · กระบี่ · ประจวบคีรีขันธ์ · สุราษฎร์ธานี · กรุงเทพฯ · นครราชสีมา · น่าน
        </p>

        <!-- Search capsule -->
        <div class="w-full max-w-2xl bg-white/90 backdrop-blur-md border border-white/60 rounded-full shadow-2xl flex items-center gap-2 px-3 py-2">
          <Search class="w-5 h-5 text-ink-muted flex-shrink-0 ml-1" :stroke-width="1.75" />
          <input
            v-model="searchQuery"
            @keydown.enter="doSearch"
            placeholder="ค้นหาชื่อโรงแรม จังหวัด หรือทำเล..."
            class="flex-1 bg-transparent text-ink text-sm outline-none placeholder-slate-400 min-w-0 py-1"
          />
          <button
            @click="doSearch"
            class="h-10 px-6 rounded-full bg-coral-600 text-white text-sm font-medium hover:bg-coral-700 transition-colors flex-shrink-0 shadow-sm"
          >
            ค้นหา
          </button>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-[1200px] px-4 md:px-8 py-12">

      <!-- Location filter chips -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        <button
          v-for="loc in locations"
          :key="loc"
          @click="filterLocation = loc"
          :class="[
            'flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors',
            filterLocation === loc
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-line text-ink-muted hover:bg-slate-50'
          ]"
        >
          {{ loc === 'all' ? '📍 ทุกจังหวัด/ทำเล' : loc }}
        </button>
      </div>

      <!-- Featured Deal (Bento 8+4) -->
      <section v-if="featuredHotel" class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="font-display font-semibold text-2xl text-ink">ข้อเสนอพิเศษ</h2>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Big tile 8 col -->
          <article
            @click="$router.push(`/hotel/${featuredHotel.id}`)"
            class="lg:col-span-8 relative bg-white rounded-3xl border border-line overflow-hidden cursor-pointer group h-72 md:h-80 shadow-sm"
          >
            <img
              :src="featuredHotel.images?.[0]"
              :alt="featuredHotel.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div class="absolute bottom-6 left-6 right-6">
              <p class="text-white/80 text-sm mb-1 font-medium">📍 {{ featuredHotel.location }}</p>
              <h3 class="font-display font-semibold text-white text-2xl mb-2">{{ featuredHotel.name }}</h3>
              <div class="flex items-center gap-3">
                <span v-if="featuredHotel.discount" class="px-2 py-0.5 rounded-full bg-coral-500 text-white text-xs font-semibold">-{{ featuredHotel.discount }}%</span>
                <span class="text-white font-display font-semibold text-xl">฿{{ Math.round(featuredHotel.pricePerNight * (1 - featuredHotel.discount/100)) }}</span>
                <span class="text-white/60 text-sm">/ คืน</span>
              </div>
            </div>
          </article>
          <!-- Small tiles 4 col -->
          <div class="lg:col-span-4 flex flex-col gap-4">
            <article
              v-for="h in activeHotels.slice(1, 3)"
              :key="h.id"
              @click="$router.push(`/hotel/${h.id}`)"
              class="relative bg-white rounded-2xl border border-line overflow-hidden cursor-pointer group flex-1 h-36 shadow-sm"
            >
              <img :src="h.images?.[0]" :alt="h.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div class="absolute bottom-3 left-3 right-3">
                <h4 class="font-display font-medium text-white text-sm truncate">{{ h.name }}</h4>
                <p class="text-white/80 text-xs">📍 {{ h.location }}</p>
                <p class="text-white/90 text-xs font-medium">฿{{ Math.round(h.pricePerNight * (1 - h.discount/100)) }} / คืน</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Hotel Grid -->
      <section>
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="font-display font-semibold text-2xl text-ink">ที่พักแนะนำยอดนิยม</h2>
          <span class="text-sm text-ink-muted">{{ filteredHotels.length }} แห่ง</span>
        </div>

        <div v-if="filteredHotels.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <HotelCard v-for="hotel in filteredHotels" :key="hotel.id" :hotel="hotel" />
        </div>

        <div v-else class="flex flex-col items-center py-16 text-center">
          <Search class="w-12 h-12 text-slate-300 mb-4" :stroke-width="1.5" />
          <p class="text-lg font-medium text-ink mb-1">ไม่พบที่พักที่ค้นหา</p>
          <p class="text-sm text-ink-muted mb-4">ลองเปลี่ยนคำค้นหาหรือเลือกทำเลอื่น</p>
          <button @click="searchQuery = ''; filterLocation = 'all'" class="h-10 px-5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            ดูทั้งหมด
          </button>
        </div>
      </section>

    </div>
    <Footer />
  </div>
</template>
