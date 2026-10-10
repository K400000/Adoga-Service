<script setup>
// src/components/common/BaseButton.vue
const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary|secondary|outline|ghost|danger
  size:    { type: String, default: 'md' },       // lg|md|sm
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type:    { type: String, default: 'button' },
})
const emit = defineEmits(['click'])

const variantClass = {
  primary:   'bg-coral-600 text-white hover:bg-coral-700 focus-visible:ring-coral-500',
  secondary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
  outline:   'border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 focus-visible:ring-indigo-500',
  ghost:     'text-ink hover:bg-slate-100 focus-visible:ring-slate-400',
  danger:    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
}

const sizeClass = {
  lg: 'h-12 px-8 text-base gap-2',
  md: 'h-11 px-6 text-base gap-2',
  sm: 'h-9 px-4 text-sm gap-1.5',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-full transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      variantClass[variant],
      sizeClass[size],
      (disabled || loading) ? 'bg-slate-200 text-slate-500 cursor-not-allowed border-transparent hover:bg-slate-200' : '',
    ]"
  >
    <svg v-if="loading" class="animate-spin w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <slot />
  </button>
</template>
