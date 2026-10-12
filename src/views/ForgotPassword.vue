<script setup>
// src/views/ForgotPassword.vue
import { ref, computed, nextTick } from 'vue'
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
const pinDigits = ref(['', '', '', '', '', ''])
const pinInputs = ref([])
const pinError = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const pwdError = ref('')
const loading = ref(false)

const pin = computed(() => pinDigits.value.join(''))
const pwdRules = computed(() => getPasswordRules(newPwd.value))

function setPinInputRef(el, idx) {
  if (el) pinInputs.value[idx] = el
}

function doSendPin() {
  const users = db['adoga_users'] || []
  if (!email.value.trim()) { emailError.value = 'กรุณากรอกอีเมล'; return }
  const found = users.find(u => u.email === email.value.trim().toLowerCase())
  if (!found) { emailError.value = 'ไม่พบอีเมลนี้ในระบบ'; return }
  emailError.value = ''
  mockPin.value = String(Math.floor(100000 + Math.random() * 900000))
  showToast(`PIN จำลอง: ${mockPin.value}`, 'info', 10000)
  pinDigits.value = ['', '', '', '', '', '']
  pinError.value = ''
  step.value = 2
  nextTick(() => {
    pinInputs.value[0]?.focus()
  })
}

function onDigitInput(event, idx) {
  const val = event.target.value
  pinError.value = ''
  
  const digitsOnly = val.replace(/\D/g, '')
  
  if (!digitsOnly) {
    pinDigits.value[idx] = ''
    return
  }

  if (digitsOnly.length > 1) {
    const chars = digitsOnly.slice(0, 6).split('')
    chars.forEach((char, i) => {
      if (idx + i < 6) {
        pinDigits.value[idx + i] = char
      }
    })
    const nextIdx = Math.min(idx + chars.length, 5)
    pinInputs.value[nextIdx]?.focus()
    return
  }

  pinDigits.value[idx] = digitsOnly.charAt(digitsOnly.length - 1)
  if (idx < 5) {
    pinInputs.value[idx + 1]?.focus()
  }
}

function onDigitKeyDown(event, idx) {
  if (event.key === 'Backspace') {
    if (!pinDigits.value[idx] && idx > 0) {
      pinDigits.value[idx - 1] = ''
      pinInputs.value[idx - 1]?.focus()
    } else {
      pinDigits.value[idx] = ''
    }
  } else if (event.key === 'ArrowLeft' && idx > 0) {
    event.preventDefault()
    pinInputs.value[idx - 1]?.focus()
  } else if (event.key === 'ArrowRight' && idx < 5) {
    event.preventDefault()
    pinInputs.value[idx + 1]?.focus()
  }
}

function onPaste(event) {
  event.preventDefault()
  const pasted = (event.clipboardData || window.clipboardData).getData('text')
  const digitsOnly = pasted.replace(/\D/g, '').slice(0, 6)
  if (!digitsOnly) return
  
  pinError.value = ''
  const chars = digitsOnly.split('')
  chars.forEach((char, i) => {
    if (i < 6) {
      pinDigits.value[i] = char
    }
  })
  
  const targetFocus = Math.min(chars.length, 5)
  pinInputs.value[targetFocus]?.focus()

  if (digitsOnly.length === 6) {
    doVerifyPin()
  }
}

function doVerifyPin() {
  if (pin.value.length < 6) {
    pinError.value = 'กรุณากรอกรหัส PIN ให้ครบ 6 หลัก'
    return
  }
  if (pin.value !== mockPin.value) {
    pinError.value = 'รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
    return
  }
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

        <!-- Step 2: PIN (6 separate boxes) -->
        <form v-else-if="step === 2" @submit.prevent="doVerifyPin" class="flex flex-col gap-5">
          <div class="text-center">
            <p class="text-sm text-ink-muted">
              กรอก PIN 6 หลักที่แสดงในการแจ้งเตือนสำหรับ <b class="text-ink">{{ email }}</b>
            </p>
          </div>

          <div class="flex flex-col items-center">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              รหัสยืนยัน PIN 6 หลัก <span class="text-rose-500">*</span>
            </label>
            
            <div class="flex items-center justify-center gap-2 sm:gap-2.5 w-full" @paste="onPaste">
              <input
                v-for="(_, idx) in pinDigits"
                :key="idx"
                :ref="el => setPinInputRef(el, idx)"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                :value="pinDigits[idx]"
                @input="onDigitInput($event, idx)"
                @keydown="onDigitKeyDown($event, idx)"
                @focus="$event.target.select()"
                :class="[
                  'w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all outline-none',
                  pinError
                    ? 'border-rose-400 bg-rose-50/50 text-rose-700 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                    : pinDigits[idx]
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-slate-50/80 text-ink focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100'
                ]"
              />
            </div>

            <p v-if="pinError" class="text-xs text-rose-500 mt-2.5 font-medium flex items-center gap-1">
              ⚠️ {{ pinError }}
            </p>
          </div>

          <div class="p-3 bg-amber-50/80 rounded-xl border border-amber-100 text-xs text-amber-800 flex items-center justify-between">
            <span>ไม่ได้รับรหัส?</span>
            <button
              type="button"
              @click="doSendPin"
              class="font-semibold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
            >
              ส่งรหัสอีกครั้ง
            </button>
          </div>

          <BaseButton type="submit" variant="secondary" size="lg" class="w-full mt-1">ยืนยัน PIN →</BaseButton>
          <button type="button" @click="step = 1" class="text-center text-xs text-ink-muted hover:text-ink cursor-pointer">
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

