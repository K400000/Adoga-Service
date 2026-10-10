<script setup>
// src/components/common/StatusBadge.vue
import { computed } from 'vue'
import { STATUS, COLOR_CLASSES } from '../../constants/status.js'
import {
  Clock, CircleCheck, CircleX, PauseCircle, Archive,
  BedDouble, Wrench, CheckCheck, LogIn, Loader2, Undo2, Send
} from '@lucide/vue'

const props = defineProps({
  entity: { type: String, required: true }, // hotel | room | booking | payment | refund
  value:  { type: String, required: true },
  size:   { type: String, default: 'md' },   // md | sm
})

const ICON_MAP = { Clock, CircleCheck, CircleX, PauseCircle, Archive, BedDouble, Wrench, CheckCheck, LogIn, Loader2, Undo2, Send }

const info = computed(() => STATUS[props.entity]?.[props.value] || { label: props.value, color: 'slate', icon: 'Clock', hint: '' })
const classes = computed(() => COLOR_CLASSES[info.value.color] || COLOR_CLASSES.slate)
const IconComp = computed(() => ICON_MAP[info.value.icon] || Clock)
const spin = computed(() => info.value.icon === 'Loader2')
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 ring-1 font-medium',
      classes.bg, classes.text, classes.ring,
      size === 'sm' ? 'h-6 px-2 text-xs rounded-full' : 'h-7 px-3 text-sm rounded-full'
    ]"
    :title="info.hint"
  >
    <component
      :is="IconComp"
      :class="['flex-shrink-0', spin ? 'animate-spin' : '', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4']"
      :stroke-width="1.75"
    />
    {{ info.label }}
  </span>
</template>
