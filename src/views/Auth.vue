<script setup>
// src/views/Auth.vue
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { register, login } from '../services/authService.js'
import { db } from '../stores/db.js'
import { showToast } from '../utils/toast.js'
import { validateEmail, validateEmailUnique, getPasswordRules, validatePassword, validateName } from '../utils/validators.js'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { Hotel, Eye, EyeOff, Check, X } from '@lucide/vue'

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
const pwdAllPass = computed(() => pwdRules.value.every(r => r.pass))

// Demo accounts
const DEMOS = [
  { label: 'ผู้ใช้ (User)', email: 'user@gmail.com', password: 'Adoga1234' },
  { label: 'ผู้จัดการ (Manager)', email: 'hotel@domain.com', password: 'Adoga1234' },
  { label: 'แอดมิน (Admin)', email: 'admin@adoga.com', password: 'Adoga1234' },
]

function fillDemo(d) { loginEmail.value = d.email; loginPassword.value = d.password }

async function doLogin() {
  loginError.value = ''
  if (!loginEmail.value || !loginPassword.value) { loginError.value = 'กรุณากรอกอีเมลและรหัสผ่าน'; return }
  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  const res = login(loginEmail.value, loginPassword.value)
  loading.value = false
  if (!res.ok) { loginError.value = res.message; return }
  const role = res.user.role
  if (redirectTo.value) { router.push(redirectTo.value); return }
  if (role === 'manager') router.push('/manager')
  else if (role === 'admin') router.push('/admin')
  else router.push('/')
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

function goStep2() { if (validateStep1()) step.value = 2 }

async function doRegister() {
  if (!regRole.value) { roleError.value = 'กรุณาเลือกบทบาท'; return }
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
  if (!res.ok) { globalError.value = res.message; return }
  showToast('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ', 'success')
  // Switch to login with prefill
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
  { key: 'user', label: 'ผู้ใช้', desc: 'ค้นหาและจองที่พัก' },
  { key: 'manager', label: 'ผู้จัดการโรงแรม', desc: 'จัดการโรงแรมและแขก' },
  { key: 'admin', label: 'แอดมิน', desc: 'ดูแลระบบทั้งหมด' },
]
</script>

<template>
  <div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-[440px]">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3">
          <Hotel class="w-7 h-7 text-white" :stroke-width="2" />
        </div>
        <h1 class="font-display font-semibold text-2xl text-ink">Adoga</h1>
        <p class="text-sm text-ink-muted mt-1">ระบบจองที่พัก ชลบุรี</p>
      </div>

      <!-- Login required alert -->
      <div v-if="loginRequired" class="mb-4 p-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 text-sm text-amber-700 font-medium">
        ⚠️ กรุณาลงทะเบียนให้เรียบร้อยก่อนใช้งาน
      </div>

      <!-- Card -->
      <div class="bg-white rounded-3xl border border-line p-8 shadow-e1">
        <!-- Tabs -->
        <div class="flex bg-slate-100 rounded-full p-1 mb-6">
          <button
            @click="tab = 'login'; step = 1"
            :class="['flex-1 h-9 rounded-full text-sm font-medium transition-colors', tab === 'login' ? 'bg-indigo-600 text-white' : 'text-ink-muted hover:text-ink']"
          >เข้าสู่ระบบ</button>
          <button
            @click="tab = 'register'; step = 1"
            :class="['flex-1 h-9 rounded-full text-sm font-medium transition-colors', tab === 'register' ? 'bg-indigo-600 text-white' : 'text-ink-muted hover:text-ink']"
          >สมัครสมาชิก</button>
        </div>

        <!-- Global error -->
        <div v-if="globalError" class="mb-4 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700">{{ globalError }}</div>

        <!-- LOGIN FORM -->
        <form v-if="tab === 'login'" @submit.prevent="doLogin" class="flex flex-col gap-4">
          <!-- Demo accounts -->
          <div class="flex flex-col gap-2">
            <p class="text-xs text-ink-muted font-medium">Demo Accounts ⭐</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="d in DEMOS" :key="d.label" type="button"
                @click="fillDemo(d)"
                class="text-xs px-3 h-7 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
              >{{ d.label }}</button>
            </div>
          </div>

          <BaseInput label="อีเมล" type="email" v-model="loginEmail" placeholder="example@email.com" required />
          <div class="relative">
            <BaseInput :label="'รหัสผ่าน'" :type="showLoginPwd ? 'text' : 'password'" v-model="loginPassword" placeholder="••••••••" required />
            <button type="button" @click="showLoginPwd = !showLoginPwd" class="absolute right-3 top-8 text-ink-muted hover:text-ink">
              <EyeOff v-if="showLoginPwd" class="w-5 h-5" :stroke-width="1.75" />
              <Eye v-else class="w-5 h-5" :stroke-width="1.75" />
            </button>
          </div>

          <div v-if="loginError" class="text-sm text-rose-700 bg-rose-50 px-3 py-2 rounded-xl ring-1 ring-rose-200">{{ loginError }}</div>

          <BaseButton type="submit" variant="secondary" size="lg" :loading="loading" class="w-full mt-2">
            เข้าสู่ระบบ
          </BaseButton>

          <div class="flex justify-between items-center text-sm">
            <router-link to="/auth/forgot" class="text-indigo-600 hover:underline">ลืมรหัสผ่าน?</router-link>
            <router-link to="/" class="text-ink-muted hover:text-ink">เข้าชมแบบ Guest</router-link>
          </div>
        </form>

        <!-- REGISTER FORM -->
        <div v-else>
          <!-- Step 1 -->
          <form v-if="step === 1" @submit.prevent="goStep2" class="flex flex-col gap-4">
            <p class="text-sm text-ink-muted font-medium">ขั้นตอนที่ 1/2 — ข้อมูลบัญชี</p>

            <!-- Google mock -->
            <button type="button" @click="mockGoogle" class="w-full h-11 rounded-full border border-line flex items-center justify-center gap-2 text-sm font-medium text-ink hover:bg-slate-50 transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              ดำเนินการด้วย Google (Mock)
            </button>

            <div class="flex gap-3">
              <BaseInput label="ชื่อ" v-model="regFirstName" placeholder="ชื่อ" required :error="regErrors.firstName" class="flex-1" />
              <BaseInput label="นามสกุล" v-model="regLastName" placeholder="นามสกุล" required :error="regErrors.lastName" class="flex-1" />
            </div>
            <BaseInput label="ชื่อเล่น (ไม่บังคับ)" v-model="regNickname" placeholder="ชื่อเล่น" />
            <BaseInput label="อีเมล" type="email" v-model="regEmail" placeholder="example@email.com" required :error="regErrors.email" />
            <div class="relative">
              <BaseInput :label="'รหัสผ่าน'" :type="showRegPwd ? 'text' : 'password'" v-model="regPassword" placeholder="••••••••" required :error="regErrors.password" />
              <button type="button" @click="showRegPwd = !showRegPwd" class="absolute right-3 top-8 text-ink-muted hover:text-ink">
                <EyeOff v-if="showRegPwd" class="w-5 h-5" :stroke-width="1.75" />
                <Eye v-else class="w-5 h-5" :stroke-width="1.75" />
              </button>
            </div>

            <!-- Password checklist -->
            <div v-if="regPassword" class="grid grid-cols-2 gap-1 px-1">
              <div v-for="rule in pwdRules" :key="rule.label" class="flex items-center gap-1.5 text-xs">
                <Check v-if="rule.pass" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" :stroke-width="2.5" />
                <X v-else class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" :stroke-width="2.5" />
                <span :class="rule.pass ? 'text-emerald-700' : 'text-slate-400'">{{ rule.label }}</span>
              </div>
            </div>

            <BaseInput label="ยืนยันรหัสผ่าน" :type="showRegPwd ? 'text' : 'password'" v-model="regConfirm" placeholder="••••••••" required :error="regErrors.confirm" />

            <BaseButton type="submit" variant="secondary" size="lg" class="w-full mt-2">ถัดไป →</BaseButton>
          </form>

          <!-- Step 2 — Role -->
          <div v-else class="flex flex-col gap-4">
            <p class="text-sm text-ink-muted font-medium">ขั้นตอนที่ 2/2 — เลือกบทบาท</p>
            <div class="flex flex-col gap-3">
              <button
                v-for="r in ROLES" :key="r.key"
                @click="regRole = r.key"
                :class="[
                  'w-full p-4 rounded-2xl border-2 text-left transition-all',
                  regRole === r.key
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-line hover:border-indigo-200 bg-white'
                ]"
              >
                <p :class="['font-semibold text-sm', regRole === r.key ? 'text-indigo-700' : 'text-ink']">{{ r.label }}</p>
                <p class="text-xs text-ink-muted mt-0.5">{{ r.desc }}</p>
              </button>
            </div>
            <p v-if="roleError" class="text-sm text-rose-700">{{ roleError }}</p>
            <div class="flex gap-3">
              <BaseButton @click="step = 1" variant="outline" size="md" class="flex-1">← ย้อนกลับ</BaseButton>
              <BaseButton @click="doRegister" variant="secondary" size="md" :loading="loading" class="flex-1">สมัครสมาชิก</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
