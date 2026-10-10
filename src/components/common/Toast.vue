<script setup>
// src/components/common/Toast.vue — global toast system
import { CheckCircle, AlertCircle, Info, X } from '@lucide/vue'
import { toasts, dismissToast } from '../../utils/toast.js'

const icons = { success: CheckCircle, error: AlertCircle, info: Info }
const colors = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  error:   'bg-rose-50 text-rose-700 ring-rose-200',
  info:    'bg-indigo-50 text-indigo-700 ring-indigo-200',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 inset-x-4 sm:inset-auto sm:top-4 sm:right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['flex items-center gap-3 px-4 py-3 rounded-2xl ring-1 shadow-e2 pointer-events-auto w-full sm:w-[360px]', colors[t.type] || colors.info]"
          role="status"
        >
          <component :is="icons[t.type] || Info" class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
          <span class="text-sm font-medium flex-1">{{ t.message }}</span>
          <button @click="dismissToast(t.id)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors" aria-label="Close notification">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 200ms cubic-bezier(.2,.8,.2,1); }
.toast-leave-active { transition: all 150ms cubic-bezier(.2,.8,.2,1); }
.toast-enter-from  { opacity: 0; transform: translateY(-8px); }
.toast-leave-to    { opacity: 0; transform: translateX(16px); }
</style>
