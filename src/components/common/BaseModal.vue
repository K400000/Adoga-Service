<script setup>
// src/components/common/BaseModal.vue
import { computed, onMounted, onUnmounted } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: Boolean, default: false },
  title: String,
  size: { type: String, default: 'md' }, // md=448, lg=512
})
const emit = defineEmits(['close', 'update:modelValue'])

const isOpen = computed(() => props.open || props.modelValue)

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
}

function handleClose() {
  emit('close')
  emit('update:modelValue', false)
}

function onKey(e) { if (e.key === 'Escape' && isOpen.value) handleClose() }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-ink/40 backdrop-blur-sm" @click="handleClose" />
        <!-- Panel -->
        <div
          :class="[
            'relative w-full bg-white shadow-e3 z-10',
            'rounded-t-3xl sm:rounded-3xl p-6 sm:p-6',
            sizeClass[size] || sizeClass.md,
          ]"
        >
          <!-- Header -->
          <div v-if="title" class="flex items-start justify-between mb-4">
            <h3 class="text-lg font-semibold font-display text-ink pr-8">{{ title }}</h3>
            <button
              @click="handleClose"
              class="w-11 h-11 -mt-1 -mr-2 flex items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 transition-colors"
              aria-label="ปิด"
            >
              <X class="w-5 h-5" :stroke-width="1.75" />
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 300ms cubic-bezier(.2,.8,.2,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
