<script setup>
// src/views/Home.vue
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import HotelCard from '../components/common/HotelCard.vue'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import {
  Search, MapPin, Hotel,
  Wifi, Waves, Dumbbell, Utensils, Sparkles, Car, Check, RefreshCw
} from '@lucide/vue'

const router = useRouter()
const { isGuest } = useSession()

const searchQuery = ref('')
const filterLocation = ref('all')
const selectedAmenities = ref([])

const availableAmenities = [
  { id: 'wifi', label: 'ฟรี Wi-Fi', keyword: 'WiFi', icon: Wifi },
  { id: 'pool', label: 'สระว่ายน้ำ', keyword: 'สระว่ายน้ำ', icon: Waves },
  { id: 'fitness', label: 'ฟิตเนส', keyword: 'ฟิตเนส', icon: Dumbbell },
  { id: 'breakfast', label: 'อาหารเช้า', keyword: 'อาหารเช้า', icon: Utensils },
  { id: 'spa', label: 'สปา', keyword: 'สปา', icon: Sparkles },
  { id: 'parking', label: 'ที่จอดรถ', keyword: 'ที่จอดรถ', icon: Car },
]

function toggleAmenity(keyword) {
  const index = selectedAmenities.value.indexOf(keyword)
  if (index > -1) {
    selectedAmenities.value.splice(index, 1)
  } else {
    selectedAmenities.value.push(keyword)
  }
}

function clearAllFilters() {
  searchQuery.value = ''
  filterLocation.value = 'all'
  selectedAmenities.value = []
}

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

  if (selectedAmenities.value.length > 0) {
    list = list.filter(h => {
      if (!h.amenities || !Array.isArray(h.amenities)) return false
      return selectedAmenities.value.every(kw =>
        h.amenities.some(a => a.toLowerCase().includes(kw.toLowerCase()))
      )
    })
  }

  return list
})

const locations = computed(() => {
  const locs = [...new Set(activeHotels.value.map(h => h.location.split(',')[1]?.trim() || h.location))]
  return ['all', ...locs]
})

const featuredHotel = computed(() => activeHotels.value.find(h => h.rating >= 4.5) || activeHotels.value[0])

function doSearch() {
  // Computed filter handles real-time update
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col justify-between w-full overflow-x-hidden">
    <div class="w-full">
      <!-- Navbar (Full Width) -->
      <Navbar />

      <!-- Hero Banner Section (Full Bleed Edge-to-Edge 100% Screen Width) -->
      <section class="relative w-full min-h-[520px] sm:min-h-[560px] bg-slate-900 flex flex-col items-center justify-start pt-10 sm:pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        <!-- Edge-to-Edge Background Image (Tropical Beach Ocean Banner) -->
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2500&q=80"
          alt="วิวทะเลและธรรมชาติประเทศไทย"
          class="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        
        <!-- Subtle Overlay Gradient -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

        <!-- Hero Title Header -->
        <div class="relative z-10 text-center max-w-4xl mb-6 sm:mb-8 px-4">
          <h1 class="font-display font-bold text-white text-3xl sm:text-4xl md:text-5xl tracking-tight mb-2 drop-shadow-lg">
            ท่องโลกทั้งใบในราคาถูกลง
          </h1>
          <p class="text-white/90 text-sm sm:text-base font-light drop-shadow-xs">
            ค้นหาที่พักและโรงแรมยอดนิยมทั่วไทย · ชลบุรี · เชียงใหม่ · ภูเก็ต · กระบี่ · กรุงเทพฯ
          </p>
        </div>

        <!-- Floating Agoda-Style Search Card -->
        <div class="relative z-10 w-full max-w-5xl">
          <!-- Top Service Tab (Hotel Only - Flush with Left Edge) -->
          <div class="flex items-center">
            <button class="flex items-center gap-2 px-6 py-3 rounded-t-2xl bg-white text-blue-600 font-bold text-sm sm:text-base border-t-2 border-blue-600 shadow-md cursor-default">
              <Hotel class="w-5 h-5 text-blue-600" />
              <span>ค้นหาที่พัก</span>
            </button>
          </div>

          <!-- White Search Card Content -->
          <div class="bg-white rounded-b-3xl rounded-tr-3xl rounded-tl-none p-5 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative pb-12 space-y-4">
            
            <!-- Destination Search Input (Full Width) -->
            <div class="bg-white hover:bg-slate-50 transition-colors border-2 border-slate-200 focus-within:border-blue-600 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
              <Search class="w-6 h-6 text-slate-400 flex-shrink-0" :stroke-width="2" />
              <div class="flex-1 min-w-0">
                <label class="text-[11px] font-bold text-slate-400 uppercase block leading-none mb-1">จุดหมายปลายทาง หรือชื่อที่พัก</label>
                <input
                  v-model="searchQuery"
                  @keydown.enter="doSearch"
                  type="text"
                  placeholder="ใส่จุดหมายปลายทางหรือชื่อที่พัก..."
                  class="w-full bg-transparent text-slate-900 font-semibold text-base sm:text-lg outline-none placeholder-slate-400"
                />
              </div>
            </div>

            <!-- Location Filter Chips (Moved inside search card) -->
            <div>
              <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-2">
                <MapPin class="w-4 h-4 text-blue-600" />
                <span>เลือกดูตามจังหวัด / ทำเล</span>
              </label>
              <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                <button
                  v-for="loc in locations"
                  :key="loc"
                  @click="filterLocation = loc"
                  type="button"
                  :class="[
                    'flex-shrink-0 h-9 px-4 rounded-full text-xs sm:text-sm font-medium transition-all snap-start cursor-pointer border',
                    filterLocation === loc
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-blue-50/50'
                  ]"
                >
                  {{ loc === 'all' ? '📍 ทั้งหมด' : `📍 ${loc}` }}
                </button>
              </div>
            </div>

            <!-- Amenity Filter Chips (Moved inside search card) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Sparkles class="w-4 h-4 text-blue-600" />
                  <span>สิ่งอำนวยความสะดวก (Amenity Filters)</span>
                </label>
                <button
                  v-if="selectedAmenities.length > 0 || filterLocation !== 'all' || searchQuery"
                  @click="clearAllFilters"
                  type="button"
                  class="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw class="w-3.5 h-3.5" />
                  <span>ล้างตัวกรอง</span>
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="item in availableAmenities"
                  :key="item.id"
                  @click="toggleAmenity(item.keyword)"
                  type="button"
                  :class="[
                    'h-9 px-4 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border cursor-pointer select-none',
                    selectedAmenities.includes(item.keyword)
                      ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-2xs font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  ]"
                >
                  <component :is="item.icon" class="w-4 h-4 text-blue-600" />
                  <span>{{ item.label }}</span>
                  <Check v-if="selectedAmenities.includes(item.keyword)" class="w-3.5 h-3.5 text-blue-600 font-bold ml-0.5" :stroke-width="3" />
                </button>
              </div>
            </div>

            <!-- Big Agoda Blue Search Button Floating at Bottom -->
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20">
              <button
                @click="doSearch"
                type="button"
                class="min-w-[220px] sm:min-w-[280px] h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg sm:text-xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer border-2 border-white"
              >
                <span>ค้นหา</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Section Container (Full Edge-to-Edge Bleed Layout across Page Width) -->
      <main class="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-12 space-y-12 max-w-[1720px] mx-auto">

        <!-- Featured Deals (Bento Grid 8+4 cols on full screen width) -->
        <section v-if="featuredHotel" class="w-full space-y-4">
          <div class="flex items-baseline justify-between">
            <h2 class="font-display font-semibold text-xl sm:text-2xl text-ink flex items-center gap-2">
              <span>🔥 ข้อเสนอพิเศษ</span>
            </h2>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <!-- Big Tile (8 Cols on Desktop) -->
            <article
              @click="$router.push(`/hotel/${featuredHotel.id}`)"
              class="lg:col-span-8 relative bg-white rounded-2xl md:rounded-3xl border border-line overflow-hidden cursor-pointer group h-72 sm:h-80 md:h-96 shadow-sm hover:shadow-md transition-all"
            >
              <img
                :src="featuredHotel.images?.[0]"
                :alt="featuredHotel.name"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              <div class="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                    📍 {{ featuredHotel.location }}
                  </span>
                  <span v-if="featuredHotel.discount" class="px-2.5 py-0.5 rounded-md bg-coral-600 text-white text-xs font-bold shadow-xs">
                    ลด {{ featuredHotel.discount }}%
                  </span>
                </div>

                <h3 class="font-display font-semibold text-white text-xl sm:text-2xl md:text-3xl mb-2 line-clamp-1">
                  {{ featuredHotel.name }}
                </h3>

                <div class="flex items-baseline gap-2">
                  <span class="text-white font-display font-semibold text-xl sm:text-2xl">
                    ฿{{ Math.round(featuredHotel.pricePerNight * (1 - featuredHotel.discount/100)).toLocaleString() }}
                  </span>
                  <span class="text-white/70 text-xs sm:text-sm">/ คืน</span>
                </div>
              </div>
            </article>

            <!-- Small Side Tiles (4 Cols on Desktop) -->
            <div class="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <article
                v-for="h in activeHotels.slice(1, 3)"
                :key="h.id"
                @click="$router.push(`/hotel/${h.id}`)"
                class="relative bg-white rounded-2xl border border-line overflow-hidden cursor-pointer group h-36 sm:h-40 lg:h-[184px] shadow-sm hover:shadow-md transition-all"
              >
                <img
                  :src="h.images?.[0]"
                  :alt="h.name"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div class="absolute bottom-3 left-4 right-4">
                  <span class="text-white/80 text-[11px] font-medium block mb-0.5">📍 {{ h.location }}</span>
                  <h4 class="font-display font-medium text-white text-sm sm:text-base truncate mb-1">{{ h.name }}</h4>
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-white font-display font-semibold text-base">
                      ฿{{ Math.round(h.pricePerNight * (1 - h.discount/100)).toLocaleString() }}
                    </span>
                    <span class="text-white/70 text-[11px]">/ คืน</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- Recommended Hotel Grid Section (Ultra-wide responsive 1-5 cols) -->
        <section class="w-full space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-display font-semibold text-xl sm:text-2xl text-ink">
              ที่พักแนะนำยอดนิยม
            </h2>
            <span class="text-xs sm:text-sm font-medium text-ink-muted bg-slate-100 px-3 py-1 rounded-full">
              พบ {{ filteredHotels.length }} แห่ง
            </span>
          </div>

          <!-- Hotel Cards Grid: 1 col mobile, 2 col tablet, 4 col desktop, 5 col ultra-wide -->
          <div v-if="filteredHotels.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            <HotelCard v-for="hotel in filteredHotels" :key="hotel.id" :hotel="hotel" />
          </div>

          <!-- Empty Search State -->
          <div v-else class="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-line text-center">
            <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Search class="w-8 h-8" :stroke-width="1.5" />
            </div>
            <p class="text-lg font-semibold text-ink mb-1">ไม่พบที่พักตรงกับเงื่อนไขการค้นหา</p>
            <p class="text-sm text-ink-muted mb-5 max-w-sm">ลองเปลี่ยนเงื่อนไขค้นหา หรือกดล้างตัวกรองเพื่อดูที่พักทั้งหมด</p>
            <button
              @click="clearAllFilters"
              type="button"
              class="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              <span>แสดงที่พักทั้งหมด</span>
            </button>
          </div>
        </section>

      </main>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>


