<script setup>
// src/views/AdminPermissions.vue — การกำหนดสิทธิ์เข้าใช้งานเฉพาะผู้จัดการโรงแรม (Manager Only)
import { ref, computed } from 'vue'
import { db } from '../stores/db.js'
import { toggleUserAccess, register } from '../services/authService.js'
import { createHotel } from '../services/transitions.js'
import { showToast } from '../utils/toast.js'
import { formatDate } from '../utils/date.js'
import Sidebar from '../components/common/Sidebar.vue'
import BaseModal from '../components/common/BaseModal.vue'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { 
  Plus, UserCheck, UserX, Hotel, Mail, Calendar, CheckCircle2, XCircle, Search
} from '@lucide/vue'

const searchQuery = ref('')
const filterStatus = ref('all') // all | active | disabled

// Add Manager Modal state
const showAddModal = ref(false)
const newGmail = ref('')
const newNickname = ref('')
const newFirstName = ref('')
const newLastName = ref('')
const newHotelName = ref('')
const newPassword = ref('Adoga1234')
const modalError = ref('')
const modalLoading = ref(false)

const allUsers = computed(() => db['adoga_users'] || [])
const hotels = computed(() => db['adoga_hotels'] || [])

// Filter ONLY Manager accounts (การกำหนดสิทธิ์ = การให้สิทธิ์คนนั้น เป็น manager)
const managerAccounts = computed(() => {
  const managersOnly = allUsers.value.filter(u => u.role === 'manager')
  return managersOnly.map(u => {
    // Find hotel managed by this user
    const userHotels = hotels.value.filter(h => h.managerId === u.id)
    const hotelName = userHotels.map(h => h.name).join(', ') || 'ยังไม่ได้กำหนดโรงแรม'
    const nickname = u.nickname || u.firstName || u.email.split('@')[0]
    
    return {
      ...u,
      hotelName,
      nickname,
      isEnabled: !u.disabled && u.status !== 'disabled'
    }
  })
})

const filteredAccounts = computed(() => {
  return managerAccounts.value.filter(acc => {
    const q = searchQuery.value.trim().toLowerCase()
    const matchesQuery = !q || 
      acc.id.toLowerCase().includes(q) || 
      acc.email.toLowerCase().includes(q) || 
      acc.nickname.toLowerCase().includes(q) || 
      acc.hotelName.toLowerCase().includes(q)

    if (filterStatus.value === 'active') return matchesQuery && acc.isEnabled
    if (filterStatus.value === 'disabled') return matchesQuery && !acc.isEnabled
    return matchesQuery
  })
})

// Stats
const totalManagers = computed(() => managerAccounts.value.length)
const activeCount = computed(() => managerAccounts.value.filter(a => a.isEnabled).length)
const disabledCount = computed(() => managerAccounts.value.filter(a => !a.isEnabled).length)

function handleToggle(account) {
  const newStatus = !account.isEnabled
  const res = toggleUserAccess(account.id, newStatus)
  if (res.ok) {
    showToast(
      newStatus 
        ? `เปิดสิทธิ์เข้าใช้งานสำเร็จ (${account.email})` 
        : `ระงับสิทธิ์เข้าใช้งานเรียบร้อย (${account.email})`,
      newStatus ? 'success' : 'info'
    )
  } else {
    showToast(res.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์', 'error')
  }
}

async function handleAddManager() {
  modalError.value = ''
  if (!newGmail.value || !newNickname.value || !newHotelName.value) {
    modalError.value = 'กรุณากรอก Gmail, ชื่อเล่น/Username และชื่อโรงแรมให้ครบถ้วน'
    return
  }
  modalLoading.value = true
  await new Promise(r => setTimeout(r, 400))

  const fn = newFirstName.value.trim() || newNickname.value.trim()
  const ln = newLastName.value.trim() || 'Manager'

  const res = register({
    email: newGmail.value.trim(),
    password: newPassword.value,
    firstName: fn,
    lastName: ln,
    nickname: newNickname.value.trim(),
    role: 'manager',
    provider: 'gmail'
  })

  if (!res.ok) {
    modalError.value = res.message
    modalLoading.value = false
    return
  }

  // Create associated hotel for this manager
  if (newHotelName.value.trim()) {
    createHotel({
      managerId: res.user.id,
      name: newHotelName.value.trim(),
      location: 'ชลบุรี',
      description: 'โรงแรมที่พักพาร์ทเนอร์ Adoga Service',
      pricePerNight: 1800,
    })
  }

  modalLoading.value = false
  showAddModal.value = false
  showToast(`เพิ่มบัญชีผู้จัดการและสร้างโรงแรม ${newHotelName.value} เรียบร้อยแล้ว`, 'success')

  // Reset Form
  newGmail.value = ''
  newNickname.value = ''
  newFirstName.value = ''
  newLastName.value = ''
  newHotelName.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex flex-col lg:flex-row">
    <Sidebar type="admin" />

    <div class="flex-1 min-w-0 lg:ml-64 px-4 md:px-8 py-8">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display font-bold text-2xl md:text-3xl text-ink">กำหนดสิทธิ์ผู้จัดการโรงแรม (Manager Permissions)</h1>
          </div>
          <p class="text-sm text-ink-muted mt-1">
            กำหนดและให้สิทธิ์การ Login เข้าใช้งานสำหรับบัญชีผู้จัดการโรงแรม (หากไม่มีสิทธิ์ ระบบจะแจ้งเตือนทันทีเมื่อเข้าสู่ระบบ)
          </p>
        </div>

        <button
          @click="showAddModal = true"
          type="button"
          class="flex items-center justify-center gap-2 px-5 h-11 rounded-2xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 cursor-pointer self-start md:self-auto"
        >
          <Plus class="w-5 h-5" :stroke-width="2" />
          <span>สร้าง Gmail & เพิ่มผู้จัดการโรงแรม</span>
        </button>
      </div>

      <!-- Stats overview -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-2xl border border-line p-5 flex items-center gap-4 shadow-xs">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Hotel class="w-6 h-6" :stroke-width="1.75" />
          </div>
          <div>
            <p class="text-xs font-medium text-ink-muted">จำนวนผู้จัดการโรงแรมทั้งหมด</p>
            <p class="text-2xl font-extrabold text-ink mt-0.5">{{ totalManagers }} <span class="text-xs font-normal text-slate-400">บัญชี</span></p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-emerald-100 p-5 flex items-center gap-4 shadow-xs">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck class="w-6 h-6" :stroke-width="1.75" />
          </div>
          <div>
            <p class="text-xs font-medium text-ink-muted">มีสิทธิ์เข้าใช้งานระบบ (Active)</p>
            <p class="text-2xl font-extrabold text-emerald-600 mt-0.5">{{ activeCount }} <span class="text-xs font-normal text-slate-400">บัญชี</span></p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-rose-100 p-5 flex items-center gap-4 shadow-xs">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
            <UserX class="w-6 h-6" :stroke-width="1.75" />
          </div>
          <div>
            <p class="text-xs font-medium text-ink-muted">ไม่มีสิทธิ์เข้าใช้งาน (Disabled)</p>
            <p class="text-2xl font-extrabold text-rose-600 mt-0.5">{{ disabledCount }} <span class="text-xs font-normal text-slate-400">บัญชี</span></p>
          </div>
        </div>
      </div>

      <!-- Controls & Filter Bar -->
      <div class="bg-white rounded-2xl border border-line p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" :stroke-width="2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหา Gmail, Username หรือชื่อโรงแรม..."
            class="w-full h-10 pl-10 pr-4 rounded-xl border border-line bg-slate-50 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            @click="filterStatus = 'all'"
            :class="['px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer', filterStatus === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          >
            ทั้งหมด ({{ filteredAccounts.length }})
          </button>
          <button
            @click="filterStatus = 'active'"
            :class="['px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer', filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          >
            มีสิทธิ์ใช้งาน
          </button>
          <button
            @click="filterStatus = 'disabled'"
            :class="['px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer', filterStatus === 'disabled' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          >
            ไม่มีสิทธิ์ใช้งาน
          </button>
        </div>
      </div>

      <!-- Manager Accounts Table -->
      <div class="bg-white rounded-3xl border border-line overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider">
                <th class="py-4 px-6">Gmail / อีเมล</th>
                <th class="py-4 px-6">ชื่อโรงแรม</th>
                <th class="py-4 px-6">ชื่อเล่น / Username</th>
                <th class="py-4 px-6">วันที่สร้าง</th>
                <th class="py-4 px-6 text-center">สิทธิ์การเข้าใช้งาน (Toggle)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line text-sm">
              <tr 
                v-for="acc in filteredAccounts" 
                :key="acc.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- Gmail / Email -->
                <td class="py-4 px-6 font-medium text-ink">
                  <div class="flex items-center gap-2">
                    <Mail class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span class="font-semibold text-slate-800">{{ acc.email }}</span>
                  </div>
                </td>

                <!-- Hotel Name -->
                <td class="py-4 px-6 font-semibold text-indigo-950">
                  <div class="flex items-center gap-2">
                    <Hotel class="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{{ acc.hotelName }}</span>
                  </div>
                </td>

                <!-- Nickname / Username -->
                <td class="py-4 px-6">
                  <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200">
                    {{ acc.nickname }}
                  </span>
                </td>

                <!-- Created Date -->
                <td class="py-4 px-6 text-xs text-ink-muted">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ formatDate(acc.createdAt || new Date().toISOString()) }}</span>
                  </div>
                </td>

                <!-- Toggle Switch Column -->
                <td class="py-4 px-6 text-center">
                  <div class="inline-flex items-center gap-3">
                    <button
                      @click="handleToggle(acc)"
                      type="button"
                      :class="[
                        'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-xs',
                        acc.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      ]"
                      :title="acc.isEnabled ? 'คลิกเพื่อระงับสิทธิ์' : 'คลิกเพื่ออนุญาตให้เข้าใช้งาน'"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                          acc.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        ]"
                      />
                    </button>

                    <span :class="['text-xs font-bold w-28 text-left', acc.isEnabled ? 'text-emerald-700' : 'text-rose-600']">
                      {{ acc.isEnabled ? '✓ มีสิทธิ์เข้าใช้งาน' : '✕ ไม่มีสิทธิ์เข้าใช้งาน' }}
                    </span>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredAccounts.length === 0">
                <td colspan="5" class="py-12 text-center text-ink-muted">
                  ไม่พบบัญชีผู้จัดการโรงแรมตามเงื่อนไขที่ค้นหา
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: Admin สร้าง Gmail และระบุ Username + ชื่อโรงแรม -->
    <BaseModal
      v-model="showAddModal"
      title="สร้าง Gmail & กำหนดสิทธิ์ผู้จัดการโรงแรมใหม่"
      size="md"
    >
      <form @submit.prevent="handleAddManager" class="flex flex-col gap-4 py-2">
        <p class="text-xs text-ink-muted">
          บันทึก Gmail, Username/ชื่อเล่น และชื่อโรงแรมเพื่อสร้างบัญชี Manager เข้าใช้งานในระบบ
        </p>

        <div v-if="modalError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {{ modalError }}
        </div>

        <BaseInput
          label="Gmail ผู้จัดการโรงแรม"
          type="email"
          v-model="newGmail"
          placeholder="เช่น manager.seaview@gmail.com หรือ xxx@hotel.co"
          required
        />

        <BaseInput
          label="Username / ชื่อเล่นผู้จัดการ"
          v-model="newNickname"
          placeholder="เช่น Somchai, Chai_Manager"
          required
        />

        <BaseInput
          label="ชื่อโรงแรม"
          v-model="newHotelName"
          placeholder="เช่น Chonburi Grand Horizon Resort"
          required
        />

        <div class="grid grid-cols-2 gap-3">
          <BaseInput label="ชื่อจริง (ไม่บังคับ)" v-model="newFirstName" placeholder="สมชาย" />
          <BaseInput label="นามสกุล (ไม่บังคับ)" v-model="newLastName" placeholder="รักไทย" />
        </div>

        <BaseInput label="รหัสผ่านเริ่มต้น" type="password" v-model="newPassword" placeholder="Adoga1234" required />

        <div class="flex justify-end gap-3 mt-4">
          <BaseButton type="button" variant="outline" @click="showAddModal = false">ยกเลิก</BaseButton>
          <BaseButton type="submit" variant="secondary" :loading="modalLoading">สร้างบัญชีและเปิดสิทธิ์</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
