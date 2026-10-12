<script setup>
// src/views/UserMessage.vue
import { computed, ref, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import { Search, SlidersHorizontal, Send, MessageCircle, MapPin, CheckCheck, Building, ArrowLeft } from '@lucide/vue'

const route = useRoute()
const { session } = useSession()
const selectedHotelId = ref(null)
const searchQuery = ref('')
const newMsg = ref('')
const msgContainer = ref(null)

// Format message timestamp
function formatMsgTime(isoStr) {
  if (!isoStr) return ''
  const date = new Date(isoStr)
  const now = new Date()
  
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const timeStr = `${hours}:${minutes}`
  
  if (date.toDateString() === now.toDateString()) {
    return timeStr
  }
  
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'เมื่อวาน'
  }
  
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} วันที่แล้ว`
  }
  
  return `${date.getDate()}/${date.getMonth() + 1}`
}

// Compute all hotel threads for current user
const userThreads = computed(() => {
  const allMessages = db['adoga_messages'] || []
  const userId = session.value?.userId
  if (!userId) return []
  
  const bookings = (db['adoga_bookings'] || []).filter(b => b.userId === userId)
  const bookedHotelIds = bookings.map(b => b.hotelId)
  const messagedHotelIds = allMessages.filter(m => m.userId === userId).map(m => m.hotelId)
  
  // Combine unique hotel IDs
  const allHotelIds = [...new Set([...bookedHotelIds, ...messagedHotelIds])]
  const hotels = (db['adoga_hotels'] || []).filter(h => allHotelIds.includes(h.id))
  
  let threads = hotels.map(h => {
    const hotelMsgs = allMessages
      .filter(m => m.hotelId === h.id && m.userId === userId)
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      
    const last = hotelMsgs[0]
    const unreadCount = hotelMsgs.filter(m => m.sender === 'manager' && m.unread).length
    
    return {
      hotel: h,
      lastMsg: last ? last.text : 'เริ่มสนทนากับที่พักเพื่อสอบถามข้อมูล',
      lastAt: last ? last.sentAt : null,
      unreadCount: unreadCount,
    }
  })

  // Sort by latest message date
  threads.sort((a, b) => {
    if (!a.lastAt) return 1
    if (!b.lastAt) return -1
    return new Date(b.lastAt) - new Date(a.lastAt)
  })

  // Filter search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    threads = threads.filter(t =>
      t.hotel.name.toLowerCase().includes(q) ||
      t.lastMsg.toLowerCase().includes(q) ||
      t.hotel.location.toLowerCase().includes(q)
    )
  }

  return threads
})

function markAsRead(hotelId) {
  if (!hotelId || !session.value?.userId) return
  const allMessages = db['adoga_messages'] || []
  let updated = false
  const updatedMessages = allMessages.map(m => {
    if (m.hotelId === hotelId && m.userId === session.value.userId && m.sender === 'manager' && m.unread) {
      updated = true
      return { ...m, unread: false }
    }
    return m
  })
  if (updated) {
    db['adoga_messages'] = updatedMessages
  }
}

function selectThread(hotelId) {
  selectedHotelId.value = hotelId
  markAsRead(hotelId)
}

function scrollToBottom(smooth = false) {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTo({
        top: msgContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  })
}

const selectedHotel = computed(() => {
  if (!selectedHotelId.value) return null
  return (db['adoga_hotels'] || []).find(h => h.id === selectedHotelId.value)
})

const currentMessages = computed(() => {
  if (!selectedHotelId.value || !session.value?.userId) return []
  return (db['adoga_messages'] || [])
    .filter(m => m.hotelId === selectedHotelId.value && m.userId === session.value.userId)
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
})

watch(selectedHotelId, () => {
  scrollToBottom(false)
})

watch(() => currentMessages.value.length, () => {
  scrollToBottom(true)
})

// Default select thread (from query or first available on desktop)
onMounted(() => {
  const queryHotelId = route.query.hotelId
  if (queryHotelId && (db['adoga_hotels'] || []).some(h => h.id === queryHotelId)) {
    selectedHotelId.value = queryHotelId
    markAsRead(selectedHotelId.value)
  } else if (window.innerWidth >= 768 && userThreads.value.length > 0) {
    selectedHotelId.value = userThreads.value[0].hotel.id
    markAsRead(selectedHotelId.value)
  }
  scrollToBottom(false)
})

async function sendMsg() {
  if (!newMsg.value.trim() || !selectedHotelId.value || !session.value?.userId) return
  const msg = {
    id: 'MSG' + Date.now(),
    hotelId: selectedHotelId.value,
    userId: session.value.userId,
    sender: 'user',
    text: newMsg.value.trim(),
    sentAt: new Date().toISOString(),
    unread: false,
  }
  db['adoga_messages'] = [...(db['adoga_messages'] || []), msg]
  newMsg.value = ''
  scrollToBottom(true)
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col">
    <Navbar />
    
    <div class="flex-1 mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-8 py-4 sm:py-6 flex flex-col">
      <h1 class="font-display font-bold text-2xl sm:text-3xl text-slate-900 mb-4 sm:mb-6">ข้อความ</h1>

      <!-- Messaging Interface Container -->
      <div class="bg-white rounded-3xl border border-line overflow-hidden flex flex-col md:flex-row h-[calc(100vh-180px)] min-h-[500px] md:h-[720px] shadow-sm">
        
        <!-- Sidebar: Conversation List -->
        <div :class="['w-full md:w-80 lg:w-96 border-r border-line flex-col bg-slate-50/40 min-h-0', selectedHotelId ? 'hidden md:flex' : 'flex']">
          
          <!-- Top Search Header Box -->
          <div class="p-4 border-b border-line bg-white flex-shrink-0">
            <div class="bg-slate-100 hover:bg-slate-200/70 transition-colors rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 border border-slate-200/70">
              <Search class="w-5 h-5 text-slate-400 flex-shrink-0" :stroke-width="2" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาโรงแรมหรือข้อความ..."
                class="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder-slate-400"
              />
              <SlidersHorizontal class="w-4 h-4 text-slate-400 flex-shrink-0 cursor-pointer hover:text-slate-600" />
            </div>
          </div>

          <!-- Conversation Threads List -->
          <div class="flex-1 overflow-y-auto min-h-0 p-3 space-y-1.5 chat-scroll">
            <div v-if="!userThreads.length" class="py-12 text-center text-sm text-slate-400">
              <Building class="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>ไม่พบรายการการสนทนา</p>
            </div>

            <!-- Thread Item Card -->
            <button
              v-for="item in userThreads"
              :key="item.hotel.id"
              @click="selectThread(item.hotel.id)"
              :class="[
                'w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 border cursor-pointer group',
                selectedHotelId === item.hotel.id
                  ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                  : 'bg-white hover:bg-slate-100/70 border-transparent hover:border-slate-200'
              ]"
            >
              <!-- Hotel Thumbnail Image -->
              <img
                :src="item.hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80'"
                :alt="item.hotel.name"
                class="w-13 h-13 object-cover rounded-2xl flex-shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
              />

              <!-- Title, Message Snippet & Timestamp Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline justify-between mb-1 gap-2">
                  <h4 class="font-semibold text-slate-900 text-sm sm:text-base truncate leading-snug">
                    {{ item.hotel.name }}
                  </h4>
                  <span class="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                    {{ formatMsgTime(item.lastAt) }}
                  </span>
                </div>

                <!-- Latest Message directly under name -->
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs text-slate-500 truncate leading-snug line-clamp-1">
                    {{ item.lastMsg }}
                  </p>
                  
                  <!-- Unread count badge or dot -->
                  <span
                    v-if="item.unreadCount > 0"
                    class="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs"
                  >
                    {{ item.unreadCount }}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Chat Area (Right Side) -->
        <div :class="['flex-1 flex-col bg-white min-h-0', selectedHotelId ? 'flex' : 'hidden md:flex']">
          <div v-if="!selectedHotel" class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageCircle class="w-16 h-16 text-slate-300 mb-4" :stroke-width="1.5" />
            <p class="text-lg font-semibold text-slate-700 mb-1">เลือกการสนทนา</p>
            <p class="text-sm text-slate-400">เลือกโรงแรมด้านซ้ายมือเพื่อเริ่มพูดคุยและสอบถามข้อมูลเพิ่มเติม</p>
          </div>

          <div v-else class="flex-1 flex flex-col min-h-0">
            <!-- Chat Room Top Bar Header -->
            <div class="p-3.5 sm:p-4 border-b border-line flex items-center justify-between bg-white/80 backdrop-blur-md flex-shrink-0">
              <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <!-- Mobile Back Button -->
                <button
                  @click="selectedHotelId = null"
                  type="button"
                  class="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold text-xs sm:text-sm md:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 cursor-pointer flex-shrink-0"
                >
                  <ArrowLeft class="w-5 h-5 text-slate-700" />
                  <span>ย้อนกลับ</span>
                </button>

                <img
                  :src="selectedHotel.images?.[0]"
                  :alt="selectedHotel.name"
                  class="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                />
                <div class="min-w-0">
                  <h3 class="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">{{ selectedHotel.name }}</h3>
                  <p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin class="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span class="truncate">{{ selectedHotel.location }}</span>
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 flex-shrink-0"></span>
                    <span class="text-emerald-600 font-medium flex-shrink-0">ออนไลน์</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Messages Message Container Stream with background-message.png -->
            <div
              ref="msgContainer"
              class="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 relative bg-cover bg-center chat-scroll"
              style="background-image: url('/docs/ui-specs/background-message.png');"
            >
              <!-- Soft Overlay for Contrast -->
              <div class="absolute inset-0 bg-white/40 pointer-events-none" />

              <div
                v-for="m in currentMessages"
                :key="m.id"
                :class="['flex flex-col relative z-10', m.sender === 'user' ? 'items-end' : 'items-start']"
              >
                <div
                  :class="[
                    'max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs',
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs font-medium shadow-blue-600/20'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-slate-200/50'
                  ]"
                >
                  {{ m.text }}
                </div>
                <span class="text-[10px] font-medium text-slate-500 mt-1 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-xs flex items-center gap-1 shadow-2xs">
                  {{ formatMsgTime(m.sentAt) }}
                  <CheckCheck v-if="m.sender === 'user'" class="w-3 h-3 text-blue-500" />
                </span>
              </div>
            </div>

            <!-- Bottom Input Bar -->
            <div class="p-3 sm:p-4 border-t border-line bg-white flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <input
                v-model="newMsg"
                @keydown.enter.prevent="sendMsg"
                type="text"
                placeholder="พิมพ์ข้อความตอบกลับ..."
                class="flex-1 h-10 sm:h-11 px-4 sm:px-5 rounded-full border-2 border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-600 transition-colors"
              />
              <button
                @click="sendMsg"
                :disabled="!newMsg.trim()"
                type="button"
                class="h-10 sm:h-11 px-4 sm:px-6 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center gap-1.5 sm:gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                <span>ส่ง</span>
                <Send class="w-4 h-4" :stroke-width="2" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <Footer />
  </div>
</template>

<style scoped>
.chat-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}
.chat-scroll::-webkit-scrollbar {
  width: 6px;
}
.chat-scroll::-webkit-scrollbar-track {
  background: #f8fafc;
}
.chat-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
.chat-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

