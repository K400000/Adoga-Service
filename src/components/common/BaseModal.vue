<script setup>
// src/components/common/BaseModal.vue
import { onMounted, onUnmounted } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  title: String,
  size: { type: String, default: 'md' }, // md=448, lg=512
})
const emit = defineEmits(['close'])

const sizeClass = { md: 'max-w-md', lg: 'max-w-lg' }

function onKey(e) { if (e.key === 'Escape' && props.open) emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        @click.self="emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-ink/40 backdrop-blur-sm" @click="emit('close')" />
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
              @click="emit('close')"
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
