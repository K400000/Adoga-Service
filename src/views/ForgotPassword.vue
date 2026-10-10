<script setup>
// src/views/ForgotPassword.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../stores/db.js'
import { resetPassword } from '../services/authService.js'
import { getPasswordRules } from '../utils/validators.js'
import { showToast } from '../utils/toast.js'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { Hotel, Check, X } from '@lucide/vue'

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
  <div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-[440px]">
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3">
          <Hotel class="w-7 h-7 text-white" :stroke-width="2" />
        </div>
        <h1 class="font-display font-semibold text-2xl text-ink">ลืมรหัสผ่าน</h1>
      </div>

      <div class="bg-white rounded-3xl border border-line p-8 shadow-e1">
        <!-- Step 1: Email -->
        <form v-if="step === 1" @submit.prevent="doSendPin" class="flex flex-col gap-4">
          <p class="text-sm text-ink-muted">กรอกอีเมลที่ใช้ลงทะเบียน เพื่อรับ PIN ยืนยัน</p>
          <BaseInput label="อีเมล" type="email" v-model="email" placeholder="example@email.com" :error="emailError" required />
          <BaseButton type="submit" variant="secondary" size="lg" class="w-full">ส่ง PIN</BaseButton>
          <router-link to="/auth" class="text-center text-sm text-indigo-600 hover:underline">กลับไปหน้าเข้าสู่ระบบ</router-link>
        </form>

        <!-- Step 2: PIN -->
        <form v-else-if="step === 2" @submit.prevent="doVerifyPin" class="flex flex-col gap-4">
          <p class="text-sm text-ink-muted">กรอก PIN 6 หลักที่แสดงในการแจ้งเตือน</p>
          <BaseInput label="PIN 6 หลัก" v-model="pin" placeholder="000000" maxlength="6" :error="pinError" required />
          <BaseButton type="submit" variant="secondary" size="lg" class="w-full">ยืนยัน PIN</BaseButton>
        </form>

        <!-- Step 3: New password -->
        <form v-else @submit.prevent="doReset" class="flex flex-col gap-4">
          <p class="text-sm text-ink-muted">ตั้งรหัสผ่านใหม่</p>
          <BaseInput label="รหัสผ่านใหม่" type="password" v-model="newPwd" placeholder="••••••••" required />
          <div v-if="newPwd" class="grid grid-cols-2 gap-1 px-1">
            <div v-for="rule in pwdRules" :key="rule.label" class="flex items-center gap-1.5 text-xs">
              <Check v-if="rule.pass" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" :stroke-width="2.5" />
              <X v-else class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" :stroke-width="2.5" />
              <span :class="rule.pass ? 'text-emerald-700' : 'text-slate-400'">{{ rule.label }}</span>
            </div>
          </div>
          <BaseInput label="ยืนยันรหัสผ่านใหม่" type="password" v-model="confirmPwd" placeholder="••••••••" required :error="pwdError" />
          <BaseButton type="submit" variant="secondary" size="lg" class="w-full">ตั้งรหัสผ่านใหม่</BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>
