<script setup>
// src/views/ForgotPassword.vue
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { db } from '../stores/db.js'
import { resetPassword } from '../services/authService.js'
import { getPasswordRules } from '../utils/validators.js'
import { showToast } from '../utils/toast.js'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { Hotel, Check, X, ShieldCheck, ArrowLeft } from '@lucide/vue'
import screenBg from '../../docs/ui-specs/screen.png'

const router = useRouter()
const step = ref(1) // 1=email, 2=pin, 3=newpwd
const email = ref('')
const emailError = ref('')
const mockPin = ref('')
const pin = ref('')
const pinError = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const pwdError = ref('')
const loading = ref(false)

const pwdRules = computed(() => getPasswordRules(newPwd.value))

function doSendPin() {
  const users = db['adoga_users'] || []
  if (!email.value.trim()) { emailError.value = 'กรุณากรอกอีเมล'; return }
  const found = users.find(u => u.email === email.value.trim().toLowerCase())
  if (!found) { emailError.value = 'ไม่พบอีเมลนี้ในระบบ'; return }
  emailError.value = ''
  mockPin.value = String(Math.floor(100000 + Math.random() * 900000))
  showToast(`PIN จำลอง: ${mockPin.value}`, 'info', 10000)
  step.value = 2
}

function doVerifyPin() {
  if (pin.value !== mockPin.value) { pinError.value = 'PIN ไม่ถูกต้อง'; return }
  pinError.value = ''
  step.value = 3
}

async function doReset() {
  if (newPwd.value !== confirmPwd.value) { pwdError.value = 'รหัสผ่านไม่ตรงกัน'; return }
  const res = resetPassword(email.value, newPwd.value)
  if (!res.ok) { pwdError.value = res.message; return }
  showToast('ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบ', 'success')
  router.push('/auth')
}
</script>

<template>
  <div
    class="relative min-h-screen flex flex-col justify-between items-center px-4 py-8 sm:py-12 bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${screenBg})` }"
  >
    <!-- Dark blur overlay -->
    <div class="absolute inset-0 bg-slate-950/30 backdrop-blur-[3px] pointer-events-none"></div>

    <!-- Center Card -->
    <div class="relative z-10 w-full max-w-[460px] my-auto">
      <div class="bg-white/95 backdrop-blur-md rounded-3xl border border-white/60 p-6 sm:p-8 shadow-2xl">
        <div class="flex flex-col items-center text-center mb-6">
          <img src="/docs/ui-specs/adoga_logo.png" alt="Adoga" class="h-20 w-auto object-contain mb-3" />
          <h1 class="font-display font-semibold text-2xl text-ink">ลืมรหัสผ่านใช่หรือไม่?</h1>
          <p class="text-xs sm:text-sm text-ink-muted mt-1">
            ระบุอีเมลที่คุณใช้ลงทะเบียนเพื่อรับรหัสยืนยัน PIN 6 หลักสำหรับตั้งรหัสผ่านใหม่
          </p>
        </div>

        <!-- Stepper Indicator -->
        <div class="flex items-center justify-center gap-4 mb-6 bg-slate-100/80 p-2 rounded-full border border-slate-200/50">
          <div :class="['flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full', step === 1 ? 'bg-indigo-600 text-white' : 'text-slate-500']">
            <span>1</span>
            <span>ระบุอีเมล</span>
          </div>
          <div :class="['flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full', step === 2 ? 'bg-indigo-600 text-white' : 'text-slate-500']">
            <span>2</span>
            <span>ยืนยัน PIN</span>
          </div>
          <div :class="['flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full', step === 3 ? 'bg-indigo-600 text-white' : 'text-slate-500']">
            <span>3</span>
            <span>รหัสผ่านใหม่</span>
          </div>
        </div>

        <!-- Step 1: Email -->
        <form v-if="step === 1" @submit.prevent="doSendPin" class="flex flex-col gap-4">
          <BaseInput label="อีเมลที่ลงทะเบียน" type="email" v-model="email" placeholder="guest@example.com" :error="emailError" required />
          <div class="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-700">
            ℹ️ รหัส PIN ยืนยันตัวตนมีอายุการใช้งาน 15 นาที ระบบจะจำลองรหัสแจ้งเตือนผ่าน Toast
          </div>
          <BaseButton type="submit" variant="secondary" size="lg" class="w-full mt-2">ส่งรหัส PIN 6 หลัก →</BaseButton>
          <RouterLink to="/auth" class="flex items-center justify-center gap-1.5 text-center text-sm text-ink-muted hover:text-ink pt-2">
            <ArrowLeft class="w-4 h-4" />
            <span>ย้อนกลับไปหน้าเข้าสู่ระบบ</span>
          </RouterLink>
        </form>

        <!-- Step 2: PIN -->
        <form v-else-if="step === 2" @submit.prevent="doVerifyPin" class="flex flex-col gap-4">
          <p class="text-sm text-ink-muted text-center">กรอก PIN 6 หลักที่แสดงในการแจ้งเตือนสำหรับ <b>{{ email }}</b></p>
          <BaseInput label="PIN 6 หลัก" v-model="pin" placeholder="000000" maxlength="6" :error="pinError" required class="text-center font-mono text-lg tracking-widest" />
          <BaseButton type="submit" variant="secondary" size="lg" class="w-full mt-2">ยืนยัน PIN →</BaseButton>
          <button type="button" @click="step = 1" class="text-center text-xs text-ink-muted hover:text-ink">
            เปลี่ยนอีเมล
          </button>
        </form>

        <!-- Step 3: New password -->
        <form v-else @submit.prevent="doReset" class="flex flex-col gap-4">
          <BaseInput label="รหัสผ่านใหม่" type="password" v-model="newPwd" placeholder="••••••••" required />
          <div v-if="newPwd" class="grid grid-cols-2 gap-1 px-1">
            <div v-for="rule in pwdRules" :key="rule.label" class="flex items-center gap-1.5 text-xs">
              <Check v-if="rule.pass" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" :stroke-width="2.5" />
              <X v-else class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" :stroke-width="2.5" />
              <span :class="rule.pass ? 'text-emerald-700 font-medium' : 'text-slate-400'">{{ rule.label }}</span>
            </div>
          </div>
          <BaseInput label="ยืนยันรหัสผ่านใหม่" type="password" v-model="confirmPwd" placeholder="••••••••" required :error="pwdError" />
          <BaseButton type="submit" variant="secondary" size="lg" class="w-full mt-2">ตั้งรหัสผ่านใหม่</BaseButton>
        </form>
      </div>
    </div>

    <!-- Bottom Footer -->
    <footer class="relative z-10 text-center text-xs text-white/90 drop-shadow-md mt-6 space-y-1">
      <div class="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 font-medium">
        <span>ศูนย์ช่วยเหลือ</span>
        <span>•</span>
        <span>ข้อกำหนดการใช้งาน</span>
        <span>•</span>
        <span>นโยบายความเป็นส่วนตัว</span>
        <span>•</span>
        <span>ติดต่อเรา</span>
      </div>
      <p class="text-white/80 text-[11px]">
        โครงงานรายวิชา System Analysis and Design (SA&D) • Adoga Service
      </p>
    </footer>
  </div>
</template>

