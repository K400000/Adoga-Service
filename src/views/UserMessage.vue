<script setup>
// src/views/UserMessage.vue
import { computed, ref, nextTick } from 'vue'
import { db } from '../stores/db.js'
import { useSession } from '../stores/session.js'
import Navbar from '../components/common/Navbar.vue'
import Footer from '../components/common/Footer.vue'
import { Send, MessageCircle } from '@lucide/vue'

const { session } = useSession()
const selectedHotelId = ref(null)
const newMsg = ref('')
const msgContainer = ref(null)

const myHotels = computed(() => {
  const bookings = (db['adoga_bookings'] || []).filter(b => b.userId === session.value?.userId)
  const hotelIds = [...new Set(bookings.map(b => b.hotelId))]
  return hotelIds.map(id => (db['adoga_hotels'] || []).find(h => h.id === id)).filter(Boolean)
})

const messages = computed(() => {
  if (!selectedHotelId.value) return []
  return (db['adoga_messages'] || []).filter(m => m.hotelId === selectedHotelId.value && m.userId === session.value?.userId)
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
})

async function sendMsg() {
  if (!newMsg.value.trim() || !selectedHotelId.value) return
  const msg = {
    id: 'MSG' + Date.now(),
    hotelId: selectedHotelId.value,
    userId: session.value.userId,
    sender: 'user',
    text: newMsg.value.trim(),
    sentAt: new Date().toISOString(),
  }
  db['adoga_messages'] = [...(db['adoga_messages'] || []), msg]
  newMsg.value = ''
  await nextTick()
  msgContainer.value?.scrollTo({ top: msgContainer.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col">
    <Navbar />
    <div class="flex-1 mx-auto w-full max-w-[1200px] px-4 md:px-8 py-8">
      <h1 class="font-display font-semibold text-2xl text-ink mb-6">ข้อความ</h1>

      <div class="bg-white rounded-2xl border border-line overflow-hidden flex h-[600px]">
        <!-- Hotel list -->
        <div class="w-64 border-r border-line flex flex-col">
          <div class="p-4 border-b border-line">
            <p class="text-sm font-medium text-ink-muted">โรงแรมที่เคยติดต่อ</p>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="!myHotels.length" class="p-4 text-sm text-ink-muted text-center">ยังไม่มีการติดต่อ</div>
            <button
              v-for="h in myHotels"
              :key="h.id"
              @click="selectedHotelId = h.id"
              :class="['w-full text-left px-4 py-3 transition-colors text-sm', selectedHotelId === h.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-ink hover:bg-slate-50']"
            >{{ h.name }}</button>
          </div>
        </div>

        <!-- Chat area -->
        <div class="flex-1 flex flex-col">
          <div v-if="!selectedHotelId" class="flex-1 flex flex-col items-center justify-center text-ink-muted">
            <MessageCircle class="w-12 h-12 text-slate-300 mb-3" :stroke-width="1.5" />
            <p>เลือกโรงแรมเพื่อดูข้อความ</p>
          </div>
          <template v-else>
            <div ref="msgContainer" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div
                v-for="m in messages"
                :key="m.id"
                :class="['flex', m.sender === 'user' ? 'justify-end' : 'justify-start']"
              >
                <div
                  :class="[
                    'max-w-xs px-4 py-2.5 rounded-2xl text-sm',
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-canvas border border-line text-ink rounded-tl-sm'
                  ]"
                >{{ m.text }}</div>
              </div>
            </div>
            <div class="p-4 border-t border-line flex gap-3">
              <input
                v-model="newMsg"
                @keydown.enter.prevent="sendMsg"
                placeholder="พิมพ์ข้อความ..."
                class="flex-1 h-10 px-4 rounded-full border border-line text-sm text-ink focus:outline-none focus:border-indigo-600"
              />
              <button @click="sendMsg" :disabled="!newMsg.trim()" class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                <Send class="w-4 h-4" :stroke-width="1.75" />
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>
