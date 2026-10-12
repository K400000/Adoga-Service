<script setup>
// src/components/common/BaseModal.vue
import { computed, onMounted, onUnmounted } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: Boolean, default: false },
  title: String,
  size: { type: String, default: 'md' }, // sm, md, lg, xl, 2xl, 3xl
  rounded: { type: String, default: 'rounded-none' }, // 0 border curve by default
  hideClose: { type: Boolean, default: false },
  noPadding: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'update:modelValue'])

const isOpen = computed(() => props.open || props.modelValue)

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
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
        class="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6"
        role="dialog"
        aria-modal="true"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-ink/50 backdrop-blur-xs" @click="handleClose" />

        <!-- Panel (0 border curve) -->
        <div
          :class="[
            'relative w-full bg-white shadow-2xl z-10',
            props.rounded || 'rounded-none',
            'flex flex-col',
            'max-h-[85vh] sm:max-h-[88vh]',
            'overflow-hidden',
            sizeClass[size] || sizeClass.md,
          ]"
        >
          <!-- Header (Pinned at top) -->
          <div
            v-if="title"
            class="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line flex-shrink-0 bg-white"
          >
            <h3 class="text-base sm:text-lg font-semibold font-display text-ink pr-4 truncate">{{ title }}</h3>
            <button
              v-if="!hideClose"
              @click="handleClose"
              class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
              aria-label="ปิด"
            >
              <X class="w-5 h-5" :stroke-width="1.75" />
            </button>
          </div>

          <!-- Close button if no title provided -->
          <button
            v-else-if="!hideClose"
            @click="handleClose"
            class="absolute top-3.5 right-3.5 z-20 w-8 h-8 flex items-center justify-center rounded-none bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="ปิด"
          >
            <X class="w-4 h-4" :stroke-width="2" />
          </button>

          <!-- Body with Vertical Scrolling -->
          <div
            :class="[
              'overflow-y-auto flex-1 min-h-0 modal-scroll',
              noPadding ? 'p-0' : 'px-5 sm:px-6 py-4 sm:py-5'
            ]"
          >
            <slot />
          </div>

          <!-- Footer (Pinned at bottom if provided) -->
          <div v-if="$slots.footer" class="px-5 sm:px-6 py-3.5 border-t border-line bg-slate-50/90 flex-shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { 
  transition: opacity 250ms cubic-bezier(.2,.8,.2,1); 
}
.modal-enter-from, .modal-leave-to { 
  opacity: 0; 
}

.modal-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.modal-scroll::-webkit-scrollbar {
  width: 6px;
}
.modal-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.modal-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
.modal-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
