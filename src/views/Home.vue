<script setup>
// src/views/Home.vue
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import HotelCard from '../components/common/HotelCard.vue'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import { Search, MapPin, Sparkles } from '@lucide/vue'

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
  // Filter reactivity handles search
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col justify-between">
    <div>
      <!-- Navbar -->
      <Navbar />

      <!-- Main Container: Centered Layout max-w-[1280px] -->
      <main class="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8 md:space-y-12">
        
        <!-- Hero Banner Section (Full width of container, Centered search, Cover bg) -->
        <section class="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-950 min-h-[340px] sm:min-h-[400px] md:h-[460px] flex items-center justify-center shadow-xl">
          <!-- Background Image -->
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80"
            alt="วิวทะเลและธรรมชาติประเทศไทย"
            class="absolute inset-0 w-full h-full object-cover opacity-65"
          />
          
          <!-- Gradient overlay for text contrast -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

          <!-- Hero Content -->
          <div class="relative z-10 w-full max-w-3xl px-4 sm:px-6 text-center flex flex-col items-center py-8 md:py-0">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-medium mb-4 shadow-sm">
              <Sparkles class="w-4 h-4 text-amber-300" />
              <span>ระบบจองที่พักและโรงแรมออนไลน์ยอดนิยมทั่วไทย</span>
            </div>

            <h1 class="font-display font-semibold text-white text-2xl sm:text-4xl md:text-5xl mb-3 leading-tight tracking-tight drop-shadow-md">
              ค้นหาที่พักและโรงแรมยอดนิยมทั่วไทย
            </h1>

            <p class="text-white/90 text-xs sm:text-sm md:text-base mb-6 md:mb-8 max-w-xl font-light leading-relaxed drop-shadow-sm">
              ชลบุรี · เชียงใหม่ · ภูเก็ต · กระบี่ · ประจวบคีรีขันธ์ · สุราษฎร์ธานี · กรุงเทพฯ · น่าน
            </p>

            <!-- Search Capsule Bar -->
            <div class="w-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full p-2 sm:p-2.5 border border-white/80 shadow-2xl flex flex-col sm:flex-row items-center gap-2">
              <div class="flex items-center gap-2 flex-1 min-w-0 w-full px-3 py-1">
                <Search class="w-5 h-5 text-indigo-600 flex-shrink-0" :stroke-width="2" />
                <input
                  v-model="searchQuery"
                  @keydown.enter="doSearch"
                  type="text"
                  placeholder="ค้นหาชื่อโรงแรม จังหวัด หรือทำเล..."
                  class="w-full bg-transparent text-ink text-sm sm:text-base outline-none placeholder-slate-400 font-medium"
                />
              </div>
              <button
                @click="doSearch"
                type="button"
                class="w-full sm:w-auto h-11 px-8 rounded-xl sm:rounded-full bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <Search class="w-4 h-4 sm:hidden" />
                <span>ค้นหาที่พัก</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Location Filter Chips Section -->
        <section class="w-full">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-ink-muted flex items-center gap-1.5">
              <MapPin class="w-4 h-4 text-indigo-600" />
              <span>เลือกดูตามจังหวัด/ทำเล</span>
            </h3>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            <button
              v-for="loc in locations"
              :key="loc"
              @click="filterLocation = loc"
              type="button"
              :class="[
                'flex-shrink-0 h-9 px-4 rounded-full text-xs sm:text-sm font-medium transition-all snap-start cursor-pointer border',
                filterLocation === loc
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                  : 'bg-white text-ink-muted border-line hover:border-indigo-200 hover:bg-indigo-50/50'
              ]"
            >
              {{ loc === 'all' ? '📍 ทั้งหมด' : `📍 ${loc}` }}
            </button>
          </div>
        </section>

        <!-- Featured Deals (Bento Layout 8+4) -->
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

        <!-- Recommended Hotel Grid Section -->
        <section class="w-full space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-display font-semibold text-xl sm:text-2xl text-ink">
              ที่พักแนะนำยอดนิยม
            </h2>
            <span class="text-xs sm:text-sm font-medium text-ink-muted bg-slate-100 px-3 py-1 rounded-full">
              พบ {{ filteredHotels.length }} แห่ง
            </span>
          </div>

          <!-- Hotel Cards Grid: 1 col mobile, 2 col tablet, 4 col desktop -->
          <div v-if="filteredHotels.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <HotelCard v-for="hotel in filteredHotels" :key="hotel.id" :hotel="hotel" />
          </div>

          <!-- Empty Search State -->
          <div v-else class="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-line text-center">
            <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Search class="w-8 h-8" :stroke-width="1.5" />
            </div>
            <p class="text-lg font-semibold text-ink mb-1">ไม่พบที่พักตรงกับเงื่อนไขการค้นหา</p>
            <p class="text-sm text-ink-muted mb-5 max-w-sm">ลองค้นหาด้วยชื่อจังหวัดอื่น หรือกดดูที่พักทั้งหมด</p>
            <button
              @click="searchQuery = ''; filterLocation = 'all'"
              type="button"
              class="h-10 px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              แสดงที่พักทั้งหมด
            </button>
          </div>
        </section>

      </main>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

