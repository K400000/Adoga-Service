<script setup>
// src/views/ManagerMessage.vue
import { computed, ref, nextTick, onMounted } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import Sidebar from '../components/common/Sidebar.vue'
import { Search, SlidersHorizontal, Send, MessageCircle, User, CheckCheck, Building } from '@lucide/vue'

const { session } = useSession()
const selectedThread = ref(null) // { hotelId, userId }
const searchQuery = ref('')
const newMsg = ref('')
const msgContainer = ref(null)

const myHotels = computed(() => (db['adoga_hotels'] || []).filter(h => h.managerId === session.value?.userId))
const myHotelIds = computed(() => myHotels.value.map(h => h.id))

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

function getUser(userId) {
  return (db['adoga_users'] || []).find(u => u.id === userId)
}

function getHotel(hotelId) {
  return myHotels.value.find(h => h.id === hotelId)
}

const threads = computed(() => {
  const messages = db['adoga_messages'] || []
  const map = {}
  
  for (const m of messages) {
    if (!myHotelIds.value.includes(m.hotelId)) continue
    const key = `${m.hotelId}:${m.userId}`
    
    if (!map[key]) {
      map[key] = {
        hotelId: m.hotelId,
        userId: m.userId,
        lastMsg: m.text,
        lastAt: m.sentAt,
        unreadCount: m.sender === 'user' && m.unread ? 1 : 0
      }
    } else {
      if (new Date(m.sentAt) > new Date(map[key].lastAt)) {
        map[key].lastMsg = m.text
        map[key].lastAt = m.sentAt
      }
      if (m.sender === 'user' && m.unread) {
        map[key].unreadCount += 1
      }
    }
  }
  
  let list = Object.values(map)
  
  // Sort by latest message
  list.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
  
  // Filter search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => {
      const u = getUser(t.userId)
      const h = getHotel(t.hotelId)
      return (
        (u?.nickname || u?.firstName || '').toLowerCase().includes(q) ||
        (h?.name || '').toLowerCase().includes(q) ||
        t.lastMsg.toLowerCase().includes(q)
      )
    })
  }

  return list
})

onMounted(() => {
  if (threads.value.length > 0) {
    selectedThread.value = threads.value[0]
  }
})

const messages = computed(() => {
  if (!selectedThread.value) return []
  return (db['adoga_messages'] || [])
    .filter(m => m.hotelId === selectedThread.value.hotelId && m.userId === selectedThread.value.userId)
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
})

async function sendMsg() {
  if (!newMsg.value.trim() || !selectedThread.value) return
  db['adoga_messages'] = [...(db['adoga_messages'] || []), {
    id: 'MSG' + Date.now(),
    hotelId: selectedThread.value.hotelId,
    userId: selectedThread.value.userId,
    sender: 'manager',
    text: newMsg.value.trim(),
    sentAt: new Date().toISOString(),
    unread: false,
  }]
  newMsg.value = ''
  await nextTick()
  if (msgContainer.value) {
    msgContainer.value.scrollTo({ top: msgContainer.value.scrollHeight, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <Sidebar type="manager" />
    
    <div class="flex-1 min-w-0 lg:ml-64 p-4 sm:p-6 md:p-8 flex flex-col">
      <h1 class="font-display font-bold text-2xl sm:text-3xl text-slate-900 mb-6">ข้อความจากแขก</h1>

      <!-- Messaging Interface Container -->
      <div class="bg-white rounded-3xl border border-line overflow-hidden flex flex-col md:flex-row h-[720px] shadow-sm">
        
        <!-- Sidebar: Conversation Threads List (Matching Reference Image) -->
        <div class="w-full md:w-80 lg:w-96 border-r border-line flex flex-col bg-slate-50/40">
          
          <!-- Search Header Box -->
          <div class="p-4 border-b border-line bg-white">
            <div class="bg-slate-100 hover:bg-slate-200/70 transition-colors rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 border border-slate-200/70">
              <Search class="w-5 h-5 text-slate-400 flex-shrink-0" :stroke-width="2" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาแขกหรือข้อความ..."
                class="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder-slate-400"
              />
              <SlidersHorizontal class="w-4 h-4 text-slate-400 flex-shrink-0 cursor-pointer hover:text-slate-600" />
            </div>
          </div>

          <!-- Threads List -->
          <div class="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
            <div v-if="!threads.length" class="py-12 text-center text-sm text-slate-400">
              <Building class="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>ยังไม่มีข้อความสนทนาจากแขก</p>
            </div>

            <button
              v-for="t in threads"
              :key="`${t.hotelId}:${t.userId}`"
              @click="selectedThread = t"
              :class="[
                'w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 border cursor-pointer group',
                selectedThread?.hotelId === t.hotelId && selectedThread?.userId === t.userId
                  ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                  : 'bg-white hover:bg-slate-100/70 border-transparent hover:border-slate-200'
              ]"
            >
              <!-- Hotel Photo or Guest Avatar Thumbnail -->
              <img
                :src="getHotel(t.hotelId)?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80'"
                :alt="getHotel(t.hotelId)?.name"
                class="w-13 h-13 object-cover rounded-2xl flex-shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
              />

              <!-- Title, Last Msg snippet & Timestamp -->
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline justify-between mb-0.5 gap-2">
                  <h4 class="font-semibold text-slate-900 text-sm sm:text-base truncate leading-snug">
                    {{ getHotel(t.hotelId)?.name }}
                  </h4>
                  <span class="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                    {{ formatMsgTime(t.lastAt) }}
                  </span>
                </div>

                <p class="text-xs font-semibold text-blue-600 truncate mb-0.5">
                  👤 {{ getUser(t.userId)?.nickname || getUser(t.userId)?.firstName || t.userId }}
                </p>

                <!-- Latest Message snippet directly under name -->
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs text-slate-500 truncate leading-snug line-clamp-1">
                    {{ t.lastMsg }}
                  </p>
                  
                  <span
                    v-if="t.unreadCount > 0"
                    class="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs"
                  >
                    {{ t.unreadCount }}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Chat Area (Right Side) -->
        <div class="flex-1 flex flex-col bg-white">
          <div v-if="!selectedThread" class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageCircle class="w-16 h-16 text-slate-300 mb-4" :stroke-width="1.5" />
            <p class="text-lg font-semibold text-slate-700 mb-1">เลือกการสนทนา</p>
            <p class="text-sm text-slate-400">เลือกข้อความแขกด้านซ้ายมือเพื่อตอบกลับ</p>
          </div>

          <template v-else>
            <!-- Chat Header -->
            <div class="p-4 border-b border-line flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 bg-indigo-100 text-indigo-700 font-bold rounded-2xl flex items-center justify-center border border-indigo-200">
                  <User class="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 text-base leading-tight">
                    {{ getUser(selectedThread.userId)?.firstName }} {{ getUser(selectedThread.userId)?.lastName }} ({{ getUser(selectedThread.userId)?.nickname }})
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    ที่พัก: <strong class="text-slate-800">{{ getHotel(selectedThread.hotelId)?.name }}</strong>
                  </p>
                </div>
              </div>
            </div>

            <!-- Messages Stream with background-message.png -->
            <div
              ref="msgContainer"
              class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative bg-cover bg-center"
              style="background-image: url('/docs/ui-specs/background-message.png');"
            >
              <!-- Soft Overlay for Contrast -->
              <div class="absolute inset-0 bg-white/40 pointer-events-none" />

              <div
                v-for="m in messages"
                :key="m.id"
                :class="['flex flex-col relative z-10', m.sender === 'manager' ? 'items-end' : 'items-start']"
              >
                <div
                  :class="[
                    'max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs',
                    m.sender === 'manager'
                      ? 'bg-blue-600 text-white rounded-br-xs font-medium shadow-blue-600/20'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-slate-200/50'
                  ]"
                >
                  {{ m.text }}
                </div>
                <span class="text-[10px] font-medium text-slate-500 mt-1 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-xs flex items-center gap-1 shadow-2xs">
                  {{ formatMsgTime(m.sentAt) }}
                  <CheckCheck v-if="m.sender === 'manager'" class="w-3 h-3 text-blue-500" />
                </span>
              </div>
            </div>

            <!-- Bottom Input Bar -->
            <div class="p-4 border-t border-line bg-white flex items-center gap-3">
              <input
                v-model="newMsg"
                @keydown.enter.prevent="sendMsg"
                type="text"
                placeholder="พิมพ์ข้อความตอบกลับแขก..."
                class="flex-1 h-11 px-5 rounded-full border-2 border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-600 transition-colors"
              />
              <button
                @click="sendMsg"
                :disabled="!newMsg.trim()"
                type="button"
                class="h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
              >
                <span>ส่ง</span>
                <Send class="w-4 h-4" :stroke-width="2" />
              </button>
            </div>
          </template>
        </div>

      </div>
    </div>
  </div>
</template>
