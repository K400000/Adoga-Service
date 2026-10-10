<script setup>
// src/components/common/HelpFloatingButton.vue
import { useRouter } from 'vue-router'
import { useSession } from '../../stores/session.js'
import { db } from '../../stores/db.js'
import { HelpCircle } from '@lucide/vue'

const router = useRouter()
const { session, isGuest } = useSession()

function handleHelpClick() {
  if (isGuest.value || !session.value?.userId) {
    router.push('/auth?redirect=/messages&reason=login_required')
    return
  }

  const userId = session.value.userId
  const allMessages = db['adoga_messages'] || []

  // Ensure H_ADMIN support hotel exists in db['adoga_hotels']
  const hotels = db['adoga_hotels'] || []
  if (!hotels.some(h => h.id === 'H_ADMIN')) {
    const adminSupportHotel = {
      id: 'H_ADMIN',
      managerId: 'A001',
      name: 'ฝ่ายบริการลูกค้า (Admin Support)',
      location: 'ศูนย์ช่วยเหลือ Adoga Service',
      description: 'ทีมงานผู้ดูแลระบบพร้อมช่วยเหลือและให้คำปรึกษาตลอด 24 ชั่วโมง',
      pricePerNight: 0,
      discount: 0,
      status: 'approved',
      rejectReason: null,
      images: ['/docs/ui-specs/adoga_logo.png'],
      amenities: ['ช่วยเหลือ 24 ชม.', 'ตอบกลับรวดเร็ว'],
      rating: 5.0,
      rooms: []
    }
    db['adoga_hotels'] = [...hotels, adminSupportHotel]
  }

  // Check if user already has an admin chat thread
  const hasAdminThread = allMessages.some(m => m.hotelId === 'H_ADMIN' && m.userId === userId)

  if (!hasAdminThread) {
    // Create initial welcome message from Admin Support
    const welcomeMsg = {
      id: 'MSG_ADMIN_' + Date.now(),
      hotelId: 'H_ADMIN',
      userId: userId,
      sender: 'manager', // Admin/Support side
      text: 'สวัสดีครับ ยินดีต้อนรับสู่ศูนย์ช่วยเหลือ Adoga Service มีอะไรให้ทีมงาน Admin ช่วยเหลือไหมครับ?',
      sentAt: new Date().toISOString(),
      unread: true,
    }
    db['adoga_messages'] = [...(db['adoga_messages'] || []), welcomeMsg]
  }

  // Navigate to messages page focused on H_ADMIN
  router.push('/messages?hotelId=H_ADMIN')
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-40 group">
    <!-- Tooltip label on hover -->
    <div class="absolute bottom-full right-0 mb-2 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-lg transition-all animate-fadeIn">
      <span>ช่วยเหลือ / ติดต่อแอดมิน</span>
      <div class="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1 right-5"></div>
    </div>

    <!-- Floating White Circle Button with (?) Icon -->
    <button
      @click="handleHelpClick"
      type="button"
      title="ช่วยเหลือ / ติดต่อแอดมิน"
      class="w-13 h-13 rounded-full bg-white text-indigo-600 shadow-2xl border border-slate-200/90 flex items-center justify-center hover:bg-slate-50 hover:scale-108 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-indigo-500/10 group-hover:ring-indigo-500/20"
    >
      <HelpCircle class="w-7 h-7 text-indigo-600" :stroke-width="2.2" />
    </button>
  </div>
</template>
