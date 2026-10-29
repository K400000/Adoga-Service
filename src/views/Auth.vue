<script setup>
// src/views/Auth.vue
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { register, login, loginWithGoogleEmail } from '../services/authService.js'
import { db } from '../stores/db.js'
import { showToast } from '../utils/toast.js'
import { validateEmailUnique, getPasswordRules, validatePassword, validateName } from '../utils/validators.js'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import BaseModal from '../components/common/BaseModal.vue'
import { Hotel, Eye, EyeOff, Check, X, ShieldCheck, Mail, UserCircle, UserMinus } from '@lucide/vue'
import screenBg from '../../docs/ui-specs/screen.png'

const router = useRouter()
const route = useRoute()

const tab = ref('login') // login | register
const loading = ref(false)
const globalError = ref('')
const loginRequired = computed(() => route.query.reason === 'login_required')
const redirectTo = computed(() => route.query.redirect || null)

// Google Modal State
const showGoogleModal = ref(false)
const googleError = ref('')
const customGoogleEmail = ref('')
const showCustomGoogleInput = ref(false)

const AVATAR_COLORS = ['bg-amber-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-rose-600', 'bg-cyan-600', 'bg-purple-600']

const googleAccounts = computed(() => {
  const users = (db['adoga_users'] && db['adoga_users'].length > 0)
    ? db['adoga_users']
    : [
        { email: 'user@gmail.com', firstName: 'John', lastName: 'Doe', role: 'user' },
        { email: 'mary@gmail.com', firstName: 'Mary', lastName: 'Smith', role: 'user' },
        { email: 'manager@gmail.com', firstName: 'Somchai', lastName: 'Rakthai', role: 'manager' },
        { email: 'admin@gmail.com', firstName: 'Admin', lastName: 'Adoga', role: 'admin' },
      ]

  return users.map((u, idx) => {
    const hotel = (db['adoga_hotels'] || []).find(h => h.managerId === u.id)
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim()
    let desc = 'ผู้ใช้งานทั่วไป (User)'
    if (hotel) {
      desc = hotel.name
    } else if (u.role === 'manager') {
      desc = 'ผู้จัดการ (Manager)'
    } else if (u.role === 'admin') {
      desc = 'ผู้ดูแลระบบ (Admin)'
    }

    return {
      email: u.email,
      name: fullName || u.nickname || u.email,
      role: u.role,
      desc,
      disabled: Boolean(u.disabled || u.status === 'disabled'),
      color: AVATAR_COLORS[idx % AVATAR_COLORS.length]
    }
  })
})

function openGoogleModal() {
  googleError.value = ''
  showCustomGoogleInput.value = false
  customGoogleEmail.value = ''
  showGoogleModal.value = true
}

async function selectGoogleAccount(email) {
  if (!email || !email.trim()) {
    googleError.value = 'กรุณากรอกอีเมล'
    return
  }
  const cleanEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    googleError.value = 'รูปแบบอีเมลไม่ถูกต้อง'
    return
  }
  googleError.value = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  const res = loginWithGoogleEmail(cleanEmail)
  loading.value = false
  if (!res.ok) {
    googleError.value = res.message
    showToast(res.message, 'error', 6000)
    return
  }
  showGoogleModal.value = false
  showToast(`เข้าสู่ระบบด้วย Google สำเร็จ (${cleanEmail})`, 'success')
  const role = res.user.role
  if (redirectTo.value) {
    router.push(redirectTo.value)
    return
  }
  if (role === 'manager') router.push('/manager')
  else if (role === 'admin') router.push('/admin')
  else router.push('/home')
}

onMounted(() => {
  if (loginRequired.value) {
    showToast('กรุณาลงทะเบียนให้เรียบร้อยก่อนใช้งาน', 'error', 5000)
  }
})

// Login form
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const showLoginPwd = ref(false)

// Register form
const regEmail = ref('')
const regPassword = ref('')
const regConfirm = ref('')
const regFirstName = ref('')
const regLastName = ref('')
const regNickname = ref('')
const regPhone = ref('')
const regBirthdate = ref('')
const showRegPwd = ref(false)
const regErrors = ref({})

const pwdRules = computed(() => getPasswordRules(regPassword.value))

// Demo accounts
const DEMOS = [
  { label: 'ผู้ใช้ (User)', email: 'user@gmail.com', password: 'Adoga1234' },
  { label: 'ผู้จัดการ (Manager)', email: 'manager@gmail.com', password: 'Adoga1234' },
  { label: 'แอดมิน (Admin)', email: 'admin@gmail.com', password: 'Adoga1234' },
]

function fillDemo(d) {
  loginEmail.value = d.email
  loginPassword.value = d.password
  tab.value = 'login'
}

async function doLogin() {
  loginError.value = ''
  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = 'กรุณากรอกอีเมลและรหัสผ่าน'
    return
  }
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  const res = login(loginEmail.value, loginPassword.value)
  loading.value = false
  if (!res.ok) {
    loginError.value = res.message
    showToast(res.message, 'error', 6000)
    return
  }
  const role = res.user.role
  if (redirectTo.value) {
    router.push(redirectTo.value)
    return
  }
  if (role === 'manager') router.push('/manager')
  else if (role === 'admin') router.push('/admin')
  else router.push('/home')
}

function validateRegisterForm() {
  const users = db['adoga_users'] || []
  const errors = {}
  const emailR = validateEmailUnique(regEmail.value, users)
  if (!emailR.valid) errors.email = emailR.message
  const pwR = validatePassword(regPassword.value)
  if (!pwR.valid) errors.password = pwR.message
  if (regPassword.value !== regConfirm.value) errors.confirm = 'รหัสผ่านไม่ตรงกัน'
  const fnR = validateName(regFirstName.value, 'ชื่อ')
  if (!fnR.valid) errors.firstName = fnR.message
  const lnR = validateName(regLastName.value, 'นามสกุล')
  if (!lnR.valid) errors.lastName = lnR.message
  if (!regPhone.value || !regPhone.value.trim()) errors.phone = 'กรุณากรอกเบอร์โทรศัพท์'
  if (!regBirthdate.value) errors.birthdate = 'กรุณาระบุวันเกิด'
  regErrors.value = errors
  return Object.keys(errors).length === 0
}

async function doRegister() {
  if (!validateRegisterForm()) return
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  const res = register({
    email: regEmail.value,
    password: regPassword.value,
    firstName: regFirstName.value,
    lastName: regLastName.value,
    nickname: regNickname.value,
    phone: regPhone.value,
    birthdate: regBirthdate.value,
    // Registration is always for regular users; manager/admin are assigned separately
    role: 'user',
  })
  loading.value = false
  if (!res.ok) {
    globalError.value = res.message
    return
  }
  showToast('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ', 'success')
  tab.value = 'login'
  loginEmail.value = regEmail.value
  loginPassword.value = ''
  globalError.value = ''
}

function mockGoogle() {
  const rand = Math.floor(Math.random() * 900) + 100
  regEmail.value = `demo.user${rand}@gmail.com`
  regPhone.value = `08${Math.floor(10000000 + Math.random() * 90000000)}`
  regBirthdate.value = '2000-01-01'
  tab.value = 'register'
}
</script>

<template>
  <div
    class="relative min-h-screen flex flex-col justify-between items-center px-4 py-8 sm:py-12 bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${screenBg})` }"
  >
    <!-- Background overlay with subtle blur for focus -->
    <div class="absolute inset-0 bg-slate-950/30 backdrop-blur-[3px] pointer-events-none"></div>

    <!-- Center Card Box -->
    <div class="relative z-10 w-full max-w-[460px] my-auto">
      <!-- Login required alert -->
      <div v-if="loginRequired" class="mb-4 p-4 rounded-2xl bg-amber-50/95 backdrop-blur-md ring-1 ring-amber-200 text-sm text-amber-800 font-medium shadow-lg flex items-center gap-2">
        <span class="text-base">⚠️</span>
        <span>กรุณาลงทะเบียนหรือเข้าสู่ระบบให้เรียบร้อยก่อนใช้งาน</span>
      </div>

      <!-- Auth Card -->
      <div class="bg-white/95 backdrop-blur-md rounded-3xl border border-white/60 p-6 sm:p-8 shadow-2xl">
        <!-- Logo & Header -->
        <div class="flex flex-col items-center text-center mb-6">
          <img src="/docs/ui-specs/adoga_logo.png" alt="Adoga" class="h-20 w-auto object-contain mb-3" />
          <h1 class="font-display font-semibold text-2xl text-ink">
            {{ tab === 'login' ? 'เข้าสู่ระบบหรือสร้างบัญชีผู้ใช้' : 'สมัครสมาชิก' }}
          </h1>
          <p class="text-xs sm:text-sm text-ink-muted mt-1">
            สมัครใช้บริการฟรีหรือล็อกอินเข้าสู่ระบบเพื่อรับข้อเสนอและสิทธิประโยชน์สุดพิเศษ
          </p>
        </div>

        <!-- Tabs Switcher -->
        <div class="flex bg-slate-100/90 rounded-full p-1 mb-6 border border-slate-200/50">
          <button
            type="button"
            @click="tab = 'login'"
            :class="['flex-1 h-9 rounded-full text-sm font-medium transition-all', tab === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-ink-muted hover:text-ink']"
          >เข้าสู่ระบบ</button>
          <button
            type="button"
            @click="tab = 'register'"
            :class="['flex-1 h-9 rounded-full text-sm font-medium transition-all', tab === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-ink-muted hover:text-ink']"
          >สมัครสมาชิก</button>
        </div>

        <!-- Global error alert -->
        <div v-if="globalError" class="mb-4 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
          {{ globalError }}
        </div>
        
        <!-- LOGIN FORM -->
        <form v-if="tab === 'login'" @submit.prevent="doLogin" class="flex flex-col gap-4">
          <!-- Google mock button -->
          <button
            type="button"
            @click="openGoogleModal"
            class="w-full h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center gap-2.5 text-sm font-medium text-ink hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>เข้าสู่ระบบด้วยบัญชี Google</span>
          </button>

          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-slate-200"></div>
            <span class="flex-shrink mx-3 text-xs text-ink-muted">หรือ</span>
            <div class="flex-grow border-t border-slate-200"></div>
          </div>

          <BaseInput label="อีเมล" type="email" v-model="loginEmail" placeholder="example@email.com" required />
          <BaseInput label="รหัสผ่าน" :type="showLoginPwd ? 'text' : 'password'" v-model="loginPassword" placeholder="••••••••" required>
            <template #suffix>
              <button type="button" @click="showLoginPwd = !showLoginPwd" class="text-ink-muted hover:text-ink transition-colors cursor-pointer">
                <EyeOff v-if="showLoginPwd" class="w-5 h-5" :stroke-width="1.75" />
                <Eye v-else class="w-5 h-5" :stroke-width="1.75" />
              </button>
            </template>
          </BaseInput>

          <div v-if="loginError" class="text-sm text-rose-700 bg-rose-50 px-3 py-2 rounded-xl ring-1 ring-rose-200">
            {{ loginError }}
          </div>

          <BaseButton type="submit" variant="secondary" size="lg" :loading="loading" class="w-full mt-2">
            เข้าสู่ระบบ
          </BaseButton>

          <div class="flex justify-between items-center text-sm pt-2">
            <RouterLink to="/auth/forgot" class="text-indigo-600 hover:underline">ลืมรหัสผ่าน?</RouterLink>
            <RouterLink to="/home" class="text-indigo-600 font-medium hover:underline flex items-center gap-1">
              เข้าชมแบบ Guest →
            </RouterLink>
          </div>
        </form>

        <!-- REGISTER FORM -->
        <div v-else>
          <form @submit.prevent="doRegister" class="flex flex-col gap-3.5">

            <!-- Google mock button -->
            <button
              type="button"
              @click="openGoogleModal"
              class="w-full h-10 rounded-full border border-line flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-ink hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>เข้าสู่ระบบ / สมัครด้วยบัญชี Google</span>
            </button>
          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-slate-200"></div>
            <span class="flex-shrink mx-3 text-xs text-ink-muted">หรือ</span>
            <div class="flex-grow border-t border-slate-200"></div>
          </div>

            <div class="flex gap-2">
              <BaseInput label="ชื่อ" v-model="regFirstName" placeholder="ชื่อ" required :error="regErrors.firstName" class="flex-1" />
              <BaseInput label="นามสกุล" v-model="regLastName" placeholder="นามสกุล" required :error="regErrors.lastName" class="flex-1" />
            </div>
            <BaseInput label="ชื่อเล่น (ไม่บังคับ)" v-model="regNickname" placeholder="ชื่อเล่น" />
            <div class="flex gap-2">
              <BaseInput label="เบอร์โทรศัพท์" type="tel" v-model="regPhone" placeholder="08X-XXX-XXXX" required :error="regErrors.phone" class="flex-1" />
              <BaseInput label="วันเกิด" type="date" v-model="regBirthdate" required :error="regErrors.birthdate" class="flex-1" />
            </div>
            <BaseInput label="อีเมล" type="email" v-model="regEmail" placeholder="example@email.com" required :error="regErrors.email" />
            <BaseInput label="รหัสผ่าน" :type="showRegPwd ? 'text' : 'password'" v-model="regPassword" placeholder="••••••••" required :error="regErrors.password">
              <template #suffix>
                <button type="button" @click="showRegPwd = !showRegPwd" class="text-ink-muted hover:text-ink transition-colors cursor-pointer">
                  <EyeOff v-if="showRegPwd" class="w-5 h-5" :stroke-width="1.75" />
                  <Eye v-else class="w-5 h-5" :stroke-width="1.75" />
                </button>
              </template>
            </BaseInput>

            <!-- Password checklist -->
            <div v-if="regPassword" class="grid grid-cols-2 gap-1 px-1">
              <div v-for="rule in pwdRules" :key="rule.label" class="flex items-center gap-1.5 text-xs">
                <Check v-if="rule.pass" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" :stroke-width="2.5" />
                <X v-else class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" :stroke-width="2.5" />
                <span :class="rule.pass ? 'text-emerald-700 font-medium' : 'text-slate-400'">{{ rule.label }}</span>
              </div>
            </div>

            <BaseInput label="ยืนยันรหัสผ่าน" :type="showRegPwd ? 'text' : 'password'" v-model="regConfirm" placeholder="••••••••" required :error="regErrors.confirm" />

            <BaseButton type="submit" variant="secondary" size="lg" class="w-full mt-2" :loading="loading">ยืนยันสมัครสมาชิก</BaseButton>
          </form>
        </div>
      </div>
    </div>

    <!-- Bottom Footer according to UI Spec -->
    <footer class="relative z-10 text-center text-xs text-white/90 drop-shadow-md mt-6 space-y-1">
      <div class="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 font-medium">
        <span class="hover:text-white cursor-pointer transition-colors">ศูนย์ช่วยเหลือ</span>
        <span>•</span>
        <span class="hover:text-white cursor-pointer transition-colors">ข้อกำหนดการใช้งาน</span>
        <span>•</span>
        <span class="hover:text-white cursor-pointer transition-colors">นโยบายความเป็นส่วนตัว</span>
        <span>•</span>
        <span class="hover:text-white cursor-pointer transition-colors">ติดต่อเรา</span>
      </div>
      <p class="text-white/80 text-[11px]">
        โครงงานรายวิชา System Analysis and Design (SA&D) • Adoga Service
      </p>
      <p class="text-white/70 text-[10px]">
        Copyright © 2026 Adoga Service Co., Ltd. สงวนลิขสิทธิ์ตามกฎหมาย
      </p>
    </footer>

    <!-- GOOGLE ACCOUNT CHOOSER MODAL (Exact match to Google OAuth specs) -->
    <BaseModal
      :open="showGoogleModal"
      @close="showGoogleModal = false"
      title=""
      size="md"
      :hide-close="true"
      :no-padding="true"
      rounded="rounded-none"
    >
      <div class="bg-white rounded-none overflow-hidden">
        <!-- Top Google Header Bar -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 sm:w-5 h-4 sm:h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span class="text-xs sm:text-sm font-medium text-slate-600">Sign in with Google</span>
          </div>

          <button
            @click="showGoogleModal = false"
            class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body Content -->
        <div class="px-6 sm:px-10 py-7 flex flex-col items-center">
          <!-- Title & Subtitle -->
          <h2 class="text-2xl sm:text-[26px] font-normal text-slate-900 mb-1 font-display tracking-tight text-center">Choose an account</h2>
          <p class="text-sm text-slate-600 mb-7 font-normal text-center">
            to continue to <strong class="text-blue-600 font-medium">Adoga</strong>
          </p>

          <!-- Alert Error if access disabled -->
          <div v-if="googleError" class="w-full mb-5 p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center shadow-xs">
            {{ googleError }}
          </div>

          <!-- Google Accounts List Container -->
          <div class="w-full border-t border-b border-slate-200 divide-y divide-slate-200">
            <!-- Account Item -->
            <button
              v-for="acc in googleAccounts"
              :key="acc.email"
              type="button"
              @click="selectGoogleAccount(acc.email)"
              class="w-full py-3.5 px-1 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
            >
              <div class="flex items-center gap-3.5 min-w-0">
                <div :class="['w-9 h-9 rounded-full text-white font-medium text-sm flex items-center justify-center flex-shrink-0 shadow-2xs', acc.color || 'bg-blue-600']">
                  {{ acc.name[0].toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors leading-snug truncate">{{ acc.name }}</p>
                  <p class="text-xs text-slate-500 leading-tight truncate">{{ acc.email }}</p>
                </div>
              </div>
              
              <span v-if="acc.disabled" class="text-xs text-rose-600 font-medium ml-3 flex-shrink-0">ระงับสิทธิ์</span>
              <span v-else class="text-xs text-slate-500 font-normal ml-3 flex-shrink-0">Signed out</span>
            </button>

            <!-- Use another account option -->
            <div class="py-1">
              <div v-if="!showCustomGoogleInput">
                <button
                  @click="showCustomGoogleInput = true"
                  type="button"
                  class="w-full py-3 px-1 flex items-center gap-3.5 text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <div class="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 flex-shrink-0">
                    <UserCircle class="w-5 h-5 text-slate-600" :stroke-width="1.75" />
                  </div>
                  <span class="text-sm font-medium text-slate-800">Use another account</span>
                </button>
              </div>
              <div v-else class="flex gap-2 py-2 px-1">
                <input
                  v-model="customGoogleEmail"
                  type="email"
                  placeholder="Enter Gmail (e.g. user@gmail.com)"
                  class="flex-1 h-9 px-3 rounded-none border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                  @keydown.enter="selectGoogleAccount(customGoogleEmail)"
                />
                <button
                  @click="selectGoogleAccount(customGoogleEmail)"
                  type="button"
                  class="px-3.5 h-9 rounded-none bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Privacy Disclosure Notice -->
          <p class="text-[12px] text-slate-500 text-left leading-relaxed mt-7 max-w-sm">
            To continue, Google will share your name, email address, language preference, and profile picture with Adoga.
          </p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

