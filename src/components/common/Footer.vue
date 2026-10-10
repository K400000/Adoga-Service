<script setup>
// src/components/common/Footer.vue
import { TEAM, PROJECT_INFO } from '../../constants/team.js'
import { Hotel } from '@lucide/vue'
</script>

<template>
  <footer class="bg-ink text-slate-300 py-12 mt-16">
    <div class="mx-auto max-w-[1720px] px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <!-- Brand -->
        <div>
          <div class="bg-white px-3 py-1.5 rounded-xl inline-block mb-3">
            <img src="/docs/ui-specs/adoga_logo.png" alt="Adoga" class="h-7 w-auto object-contain" />
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
            <a v-for="m in TEAM" :key="m.id" :href="`tel:${m.stdid}`" class="text-sm text-slate-400 hover:text-white transition-colors">
              {{ m.name }}: {{ m.stdid }}
            </a>
          </div>
        </div>
      </div>

      <div class="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="text-xs text-slate-500">{{ PROJECT_INFO.subject }} · สมาชิก 4 คน</p>
        <p class="text-xs text-slate-500">© {{ PROJECT_INFO.year }} Adoga Services · สงวนลิขสิทธิ์ตามกฎหมายบ้านใด</p>
      </div>
    </div>
  </footer>
</template>
