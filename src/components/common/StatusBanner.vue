<script setup>
// src/components/common/StatusBanner.vue
import { computed } from 'vue'
import { STATUS, COLOR_CLASSES } from '../../constants/status.js'
import {
  Clock, CircleCheck, CircleX, PauseCircle, Archive,
  BedDouble, Wrench, CheckCheck, LogIn, Loader2, Undo2, Send
} from '@lucide/vue'

const props = defineProps({
  entity: String,
  value: String,
  title: String,
  description: String,
})
const emit = defineEmits(['action'])

const ICON_MAP = { Clock, CircleCheck, CircleX, PauseCircle, Archive, BedDouble, Wrench, CheckCheck, LogIn, Loader2, Undo2, Send }
const info = computed(() => STATUS[props.entity]?.[props.value] || { label: props.value, color: 'slate', icon: 'Clock', hint: '' })
const c = computed(() => COLOR_CLASSES[info.value.color] || COLOR_CLASSES.slate)
const IconComp = computed(() => ICON_MAP[info.value.icon] || Clock)
</script>

<template>
  <div :class="['flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-6 rounded-2xl ring-1', c.bg, c.ring]">
    <div :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', `bg-${info.color}-100`]">
      <component :is="IconComp" :class="['w-6 h-6', c.text]" :stroke-width="1.75" />
    </div>
    <div class="flex-1 min-w-0">
      <p :class="['text-lg font-semibold font-display', c.text]">{{ title || info.label }}</p>
      <p v-if="description" class="text-sm text-ink-muted mt-0.5">{{ description || info.hint }}</p>
    </div>
    <slot name="actions" />
  </div>
</template>
