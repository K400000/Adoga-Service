<script setup>
// src/components/common/Footer.vue
import { TEAM, PROJECT_INFO } from '../../constants/team.js'
import { Hotel } from '@lucide/vue'
</script>

<template>
  <footer class="bg-ink text-slate-300 py-12 mt-16">
    <div class="mx-auto max-w-[1200px] px-4 md:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Hotel class="w-5 h-5 text-white" :stroke-width="2" />
            </div>
            <span class="font-display font-semibold text-white text-lg">Adoga</span>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">{{ PROJECT_INFO.subject }}</p>
          <p class="text-xs text-slate-500 mt-2">© {{ PROJECT_INFO.year }} {{ PROJECT_INFO.name }}</p>
        </div>

        <!-- Team members -->
        <div class="md:col-span-2">
          <h4 class="text-sm font-semibold text-white mb-3">สมาชิกกลุ่ม</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="m in TEAM" :key="m.id" class="text-sm">
              <p class="text-slate-200">{{ m.name }}</p>
              <p class="text-slate-500 text-xs">{{ m.email }}</p>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-sm font-semibold text-white mb-3">ติดต่อ</h4>
          <div class="flex flex-col gap-1">
            <a v-for="m in TEAM" :key="m.id" :href="`tel:${m.phone}`" class="text-sm text-slate-400 hover:text-white transition-colors">
              {{ m.name }}: {{ m.phone }}
            </a>
          </div>
        </div>
      </div>

      <div class="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="text-xs text-slate-500">{{ PROJECT_INFO.subject }} · สมาชิก 5 คน</p>
        <p class="text-xs text-slate-500">© {{ PROJECT_INFO.year }} Adoga Mockup · สงวนลิขสิทธิ์ตามกฎหมาย</p>
      </div>
    </div>
  </footer>
</template>
