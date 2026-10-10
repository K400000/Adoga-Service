<script setup>
// src/components/common/BaseInput.vue
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  error: String,
  helper: String,
  disabled: Boolean,
  required: Boolean,
})
const emit = defineEmits(['update:modelValue', 'blur'])
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-sm font-medium text-ink">
      {{ label }}
      <span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur', $event)"
      :class="[
        'h-12 px-4 rounded-xl border text-sm text-ink placeholder-slate-400 transition-colors',
        'focus:outline-none focus:ring-2',
        error
          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100'
          : 'border-line focus:border-indigo-600 focus:ring-indigo-100',
        disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white',
      ]"
    />
    <p v-if="error" class="text-sm text-rose-700 flex items-center gap-1">
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
      {{ error }}
    </p>
    <p v-else-if="helper" class="text-sm text-ink-muted">{{ helper }}</p>
  </div>
</template>
