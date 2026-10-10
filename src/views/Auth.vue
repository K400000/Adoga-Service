<script setup>
// src/views/Auth.vue
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { register, login } from '../services/authService.js'
import { db } from '../stores/db.js'
import { showToast } from '../utils/toast.js'
import { validateEmailUnique, getPasswordRules, validatePassword, validateName } from '../utils/validators.js'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { Hotel, Eye, EyeOff, Check, X, ShieldCheck } from '@lucide/vue'
import screenBg from '../../docs/ui-specs/screen.png'

const router = useRouter()
const route = useRoute()

const tab = ref('login') // login | register
const step = ref(1) // register step 1 | 2
const loading = ref(false)
const globalError = ref('')
const loginRequired = computed(() => route.query.reason === 'login_required')
const redirectTo = computed(() => route.query.redirect || null)

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

// Register form step 1
const regEmail = ref('')
const regPassword = ref('')
const regConfirm = ref('')
const regFirstName = ref('')
const regLastName = ref('')
const regNickname = ref('')
const showRegPwd = ref(false)
const regErrors = ref({})

// Step 2 — role
const regRole = ref('')
const roleError = ref('')

const pwdRules = computed(() => getPasswordRules(regPassword.value))

// Demo accounts
const DEMOS = [
  { label: 'ผู้ใช้ (User)', email: 'user@gmail.com', password: 'Adoga1234' },
  { label: 'ผู้จัดการ (Manager)', email: 'hotel@domain.com', password: 'Adoga1234' },
  { label: 'แอดมิน (Admin)', email: 'admin@adoga.com', password: 'Adoga1234' },
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

function validateStep1() {
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
  regErrors.value = errors
  return Object.keys(errors).length === 0
}

function goStep2() {
  if (validateStep1()) step.value = 2
}

async function doRegister() {
  if (!regRole.value) {
    roleError.value = 'กรุณาเลือกบทบาท'
    return
  }
  roleError.value = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  const res = register({
    email: regEmail.value,
    password: regPassword.value,
    firstName: regFirstName.value,
    lastName: regLastName.value,
    nickname: regNickname.value,
    role: regRole.value,
  })
  loading.value = false
  if (!res.ok) {
    globalError.value = res.message
    return
  }
  showToast('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ', 'success')
  tab.value = 'login'
  step.value = 1
  loginEmail.value = regEmail.value
  loginPassword.value = ''
  globalError.value = ''
}

function mockGoogle() {
  const rand = Math.floor(Math.random() * 900) + 100
  regEmail.value = `demo.user${rand}@gmail.com`
  tab.value = 'register'
  step.value = 1
}

const ROLES = [
  { key: 'user', label: 'ผู้ใช้ทั่วไป (User)', desc: 'ค้นหาและจองที่พักในชลบุรี' },
  { key: 'manager', label: 'ผู้จัดการโรงแรม (Manager)', desc: 'จัดการข้อมูลโรงแรม ห้องพัก และแขก' },
  { key: 'admin', label: 'ผู้ดูแลระบบ (Admin)', desc: 'อนุมัติโรงแรมและดูแลระบบภาพรวม' },
]
</script>

<template>
  <div
    class="relative min-h-screen flex flex-col justify-between items-center px-4 py-8 sm:py-12 bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${screenBg})` }"
  >
    <!-- Background overlay with subtle blur for focus -->
    <div class="absolute inset-0 bg-slate-950/30 backdrop-blur-[3px] pointer-events-none"></div>

    <!-- Security top badge -->
    <div class="relative z-10 mb-4 hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/60 text-xs text-slate-700 font-medium">
      <ShieldCheck class="w-4 h-4 text-indigo-600" />
      <span>ระบบความปลอดภัยบัญชีผู้ใช้งาน 256-Bit SSL</span>
    </div>

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
          <img src="/docs/ui-specs/adoga_logo.png" alt="Adoga" class="h-12 w-auto object-contain mb-3" />
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
            @click="tab = 'login'; step = 1"
            :class="['flex-1 h-9 rounded-full text-sm font-medium transition-all', tab === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-ink-muted hover:text-ink']"
          >เข้าสู่ระบบ</button>
          <button
            type="button"
            @click="tab = 'register'; step = 1"
            :class="['flex-1 h-9 rounded-full text-sm font-medium transition-all', tab === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-ink-muted hover:text-ink']"
          >สมัครสมาชิก</button>
        </div>

        <!-- Global error alert -->
        <div v-if="globalError" class="mb-4 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">
          {{ globalError }}
        </div>

        <!-- Quick Demo Accounts -->
        <div class="mb-5 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
          <p class="text-xs text-indigo-900 font-semibold mb-2">⭐ บัญชีทดสอบระบบ (คลิกเพื่อกรอกอัตโนมัติ)</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="d in DEMOS"
              :key="d.label"
              type="button"
              @click="fillDemo(d)"
              class="text-xs px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all font-medium shadow-xs"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <!-- LOGIN FORM -->
        <form v-if="tab === 'login'" @submit.prevent="doLogin" class="flex flex-col gap-4">
          <!-- Google mock button -->
          <button
            type="button"
            @click="mockGoogle"
            class="w-full h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center gap-2.5 text-sm font-medium text-ink hover:bg-slate-50 transition-colors shadow-xs"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>เข้าสู่ระบบด้วยบัญชี Google (Mock)</span>
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
          <!-- Step 1 -->
          <form v-if="step === 1" @submit.prevent="goStep2" class="flex flex-col gap-3.5">
            <div class="flex items-center justify-between text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
              <span>ขั้นตอนที่ 1/2 — ข้อมูลบัญชีผู้ใช้</span>
              <span class="text-slate-400">50%</span>
            </div>

            <!-- Google mock -->
            <button
              type="button"
              @click="mockGoogle"
              class="w-full h-10 rounded-full border border-line flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-ink hover:bg-slate-50 transition-colors"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              กรอกอีเมลอัตโนมัติด้วย Google (Mock)
            </button>

            <div class="flex gap-2">
              <BaseInput label="ชื่อ" v-model="regFirstName" placeholder="ชื่อ" required :error="regErrors.firstName" class="flex-1" />
              <BaseInput label="นามสกุล" v-model="regLastName" placeholder="นามสกุล" required :error="regErrors.lastName" class="flex-1" />
            </div>
            <BaseInput label="ชื่อเล่น (ไม่บังคับ)" v-model="regNickname" placeholder="ชื่อเล่น" />
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

            <BaseButton type="submit" variant="secondary" size="lg" class="w-full mt-2">ถัดไป →</BaseButton>
          </form>

          <!-- Step 2 — Role -->
          <div v-else class="flex flex-col gap-4">
            <div class="flex items-center justify-between text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
              <span>ขั้นตอนที่ 2/2 — เลือกประเภทบทบาทผู้ใช้งาน</span>
              <span class="text-slate-400">100%</span>
            </div>
            <div class="flex flex-col gap-2.5">
              <button
                v-for="r in ROLES"
                :key="r.key"
                @click="regRole = r.key"
                type="button"
                :class="[
                  'w-full p-3.5 rounded-2xl border-2 text-left transition-all',
                  regRole === r.key
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500'
                    : 'border-line hover:border-indigo-200 bg-white'
                ]"
              >
                <p :class="['font-semibold text-sm', regRole === r.key ? 'text-indigo-700' : 'text-ink']">{{ r.label }}</p>
                <p class="text-xs text-ink-muted mt-0.5">{{ r.desc }}</p>
              </button>
            </div>
            <p v-if="roleError" class="text-sm text-rose-700 bg-rose-50 p-2.5 rounded-xl">{{ roleError }}</p>
            <div class="flex gap-3 mt-1">
              <BaseButton @click="step = 1" variant="outline" size="md" class="flex-1">← ย้อนกลับ</BaseButton>
              <BaseButton @click="doRegister" variant="secondary" size="md" :loading="loading" class="flex-1">ยืนยันสมัครสมาชิก</BaseButton>
            </div>
          </div>
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
  </div>
</template>

