<script setup>
// src/components/common/StatusStepper.vue
import { computed } from 'vue'
import { CheckCheck, X } from '@lucide/vue'

const props = defineProps({
  steps: { type: Array, required: true }, // [{ key, label, done, current, cancelled }]
  horizontal: { type: Boolean, default: true },
})
</script>

<template>
  <div :class="['flex', horizontal ? 'flex-row items-center' : 'flex-col']">
    <template v-for="(step, i) in steps" :key="step.key">
      <!-- Node -->
      <div :class="['flex', horizontal ? 'flex-col items-center' : 'flex-row items-center gap-3']">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
            step.cancelled ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-200' :
            step.done ? 'bg-emerald-600 text-white' :
            step.current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
            'bg-slate-200 text-slate-400'
          ]"
        >
          <CheckCheck v-if="step.done" class="w-4 h-4" :stroke-width="2" />
          <X v-else-if="step.cancelled" class="w-4 h-4" :stroke-width="2" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          :class="[
            'text-xs mt-1 text-center max-w-16',
            step.cancelled ? 'text-rose-600 font-medium' :
            step.done ? 'text-emerald-700 font-medium' :
            step.current ? 'text-indigo-700 font-medium' :
            'text-slate-400'
          ]"
        >{{ step.label }}</span>
      </div>
      <!-- Connector -->
      <div
        v-if="i < steps.length - 1"
        :class="[
          horizontal ? 'h-0.5 flex-1 mx-2 mb-5' : 'w-0.5 h-6 ml-4 my-1',
          step.done ? 'bg-emerald-400' : 'bg-slate-200'
        ]"
      />
    </template>
  </div>
</template>
