<script setup>
// src/components/common/HotelCard.vue
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Star, Heart } from '@lucide/vue'
import { formatPrice } from '../../utils/date.js'
import { FALLBACK_IMAGE } from '../../constants/images.js'

import { db } from '../../stores/db.js'

const props = defineProps({
  hotel: { type: Object, required: true },
})

const router = useRouter()

const actualRating = computed(() => {
  const reviews = (db['adoga_reviews'] || []).filter(r => r.hotelId === props.hotel.id)
  if (!reviews.length) return props.hotel.rating || 0
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
})

const reviewCount = computed(() => {
  return (db['adoga_reviews'] || []).filter(r => r.hotelId === props.hotel.id).length
})

const minPrice = computed(() => {
  if (!props.hotel.rooms?.length) return props.hotel.pricePerNight
  return Math.min(...props.hotel.rooms.map(r => r.price))
})
const discountedPrice = computed(() => Math.round(minPrice.value * (1 - (props.hotel.discount || 0) / 100)))
const hasDiscount = computed(() => props.hotel.discount > 0)
const availableRooms = computed(() => {
  let count = 0
  for (const room of props.hotel.rooms || []) {
    count += room.units?.filter(u => u.status === 'available').length || 0
  }
  return count
})

function goDetail() { router.push(`/hotel/${props.hotel.id}`) }
</script>

<template>
  <article
    @click="goDetail"
    class="bg-white rounded-2xl border border-line overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-e1"
    :tabindex="0"
    @keydown.enter="goDetail"
    :aria-label="`${hotel.name} — ${formatPrice(discountedPrice)} ต่อคืน`"
  >
    <!-- Image -->
    <div class="relative overflow-hidden aspect-[4/3]">
      <img
        :src="hotel.images?.[0] || FALLBACK_IMAGE"
        :alt="hotel.name"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        @error="$event.target.src = FALLBACK_IMAGE"
      />
      <!-- Discount badge -->
      <div v-if="hasDiscount" class="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-coral-500 text-ink">
        -{{ hotel.discount }}%
      </div>
      <!-- Wishlist -->
      <button
        class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink-muted hover:text-rose-500 transition-colors"
        @click.stop
        aria-label="บันทึกที่พัก"
      >
        <Heart class="w-4 h-4" :stroke-width="1.75" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="font-display font-semibold text-base text-ink truncate mb-1">{{ hotel.name }}</h3>
      <p class="text-sm text-ink-muted flex items-center gap-1 mb-3">
        <MapPin class="w-4 h-4 flex-shrink-0" :stroke-width="1.75" />
        {{ hotel.location }}
      </p>
      <!-- Bottom row -->
      <div class="flex items-end justify-between gap-2">
        <div class="flex items-center gap-1">
          <Star class="w-4 h-4 text-amber-500 fill-amber-400" :stroke-width="1.75" />
          <span class="text-sm font-bold text-ink">{{ actualRating.toFixed(1) }}</span>
          <span v-if="reviewCount > 0" class="text-xs text-slate-500">({{ reviewCount }})</span>
          <span v-if="availableRooms > 0" class="text-xs text-ink-muted ml-1">(เหลือ {{ availableRooms }} ห้อง)</span>
          <span v-else class="text-xs text-rose-600 ml-1">เต็ม</span>
        </div>
        <div class="text-right">
          <p v-if="hasDiscount" class="text-xs text-ink-muted line-through">{{ formatPrice(minPrice) }}</p>
          <p class="font-display font-extrabold text-2xl text-indigo-600 tabular-nums tracking-tight">{{ formatPrice(discountedPrice) }}</p>
          <p class="text-[11px] text-ink-muted font-medium">/ คืน</p>
        </div>
      </div>
    </div>
  </article>
</template>
