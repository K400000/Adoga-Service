<script setup>
// src/views/ManagerMessage.vue
import { computed, ref, nextTick } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import { Send, MessageCircle } from '@lucide/vue'

const { session } = useSession()
const selectedThread = ref(null) // { hotelId, userId }
const newMsg = ref('')
const msgContainer = ref(null)

const myHotels = computed(() => (db['adoga_hotels'] || []).filter(h => h.managerId === session.value?.userId))
const myHotelIds = computed(() => myHotels.value.map(h => h.id))

const threads = computed(() => {
  const messages = db['adoga_messages'] || []
  const map = {}
  for (const m of messages) {
    if (!myHotelIds.value.includes(m.hotelId)) continue
    const key = `${m.hotelId}:${m.userId}`
    if (!map[key]) map[key] = { hotelId: m.hotelId, userId: m.userId, lastMsg: m.text, lastAt: m.sentAt }
    else if (new Date(m.sentAt) > new Date(map[key].lastAt)) { map[key].lastMsg = m.text; map[key].lastAt = m.sentAt }
  }
  return Object.values(map)
})

const messages = computed(() => {
  if (!selectedThread.value) return []
  return (db['adoga_messages'] || [])
    .filter(m => m.hotelId === selectedThread.value.hotelId && m.userId === selectedThread.value.userId)
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
})

function getUser(userId) { return (db['adoga_users'] || []).find(u => u.id === userId) }
function getHotel(hotelId) { return myHotels.value.find(h => h.id === hotelId) }

async function sendMsg() {
  if (!newMsg.value.trim() || !selectedThread.value) return
  db['adoga_messages'] = [...(db['adoga_messages'] || []), {
    id: 'MSG' + Date.now(),
    hotelId: selectedThread.value.hotelId,
    userId: selectedThread.value.userId,
    sender: 'manager',
    text: newMsg.value.trim(),
    sentAt: new Date().toISOString(),
  }]
  newMsg.value = ''
  await nextTick()
  msgContainer.value?.scrollTo({ top: msgContainer.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex">
    <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-line py-6 px-4 sticky top-0 h-screen">
      <p class="text-xs font-medium text-ink-muted mb-4 px-2">MANAGER PORTAL</p>
      <nav class="flex flex-col gap-1">
        <router-link to="/manager" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100">ภาพรวม</router-link>
        <router-link to="/manager/guests" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100">จัดการแขก</router-link>
        <router-link to="/manager/messages" class="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50">ข้อความ</router-link>
      </nav>
    </aside>
    <div class="flex-1 p-4 md:p-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-6">ข้อความจากแขก</h1>
      <div class="bg-white rounded-2xl border border-line overflow-hidden flex h-[600px]">
        <!-- Thread list -->
        <div class="w-72 border-r border-line flex flex-col">
          <div class="p-4 border-b border-line text-sm font-medium text-ink-muted">การสนทนา</div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="!threads.length" class="p-4 text-sm text-ink-muted text-center">ยังไม่มีข้อความ</div>
            <button
              v-for="t in threads" :key="`${t.hotelId}:${t.userId}`"
              @click="selectedThread = t"
              :class="['w-full text-left p-4 transition-colors border-b border-line/50', selectedThread?.hotelId === t.hotelId && selectedThread?.userId === t.userId ? 'bg-indigo-50' : 'hover:bg-slate-50']"
            >
              <p class="text-sm font-medium text-ink truncate">{{ getUser(t.userId)?.nickname || t.userId }}</p>
              <p class="text-xs text-ink-muted truncate">{{ getHotel(t.hotelId)?.name }}</p>
              <p class="text-xs text-ink-muted truncate mt-0.5">{{ t.lastMsg }}</p>
            </button>
          </div>
        </div>
        <!-- Chat -->
        <div class="flex-1 flex flex-col">
          <div v-if="!selectedThread" class="flex-1 flex flex-col items-center justify-center text-ink-muted">
            <MessageCircle class="w-12 h-12 text-slate-300 mb-3" :stroke-width="1.5" />
            <p>เลือกการสนทนา</p>
          </div>
          <template v-else>
            <div ref="msgContainer" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div v-for="m in messages" :key="m.id" :class="['flex', m.sender === 'manager' ? 'justify-end' : 'justify-start']">
                <div :class="['max-w-xs px-4 py-2.5 rounded-2xl text-sm', m.sender === 'manager' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-canvas border border-line text-ink rounded-tl-sm']">{{ m.text }}</div>
              </div>
            </div>
            <div class="p-4 border-t border-line flex gap-3">
              <input v-model="newMsg" @keydown.enter.prevent="sendMsg" placeholder="ตอบกลับ..." class="flex-1 h-10 px-4 rounded-full border border-line text-sm focus:outline-none focus:border-indigo-600" />
              <button @click="sendMsg" class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors"><Send class="w-4 h-4" :stroke-width="1.75" /></button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
