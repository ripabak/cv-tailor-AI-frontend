<script setup lang="ts">
import { PhBrain } from '@phosphor-icons/vue'

const props = defineProps<{
  name: string
  status: 'running' | 'done' | 'error'
}>()

const isMemoryTool = ['get_memory', 'save_fact', 'delete_fact'].includes(props.name)
</script>

<template>
  <div class="flex justify-start">
    <div
      class="rounded-lg border px-2.5 py-1.5 text-xs font-mono font-semibold inline-flex items-center gap-1.5"
      :class="{
        'border-primary/20 bg-primary-light text-primary': status === 'running',
        'border-emerald-200 bg-emerald-50 text-emerald-700': status === 'done',
        'border-red-200 bg-red-50 text-error': status === 'error',
      }"
    >
      <svg v-if="status === 'running'" class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <svg v-else-if="status === 'done'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg v-else-if="status === 'error'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <PhBrain v-if="isMemoryTool" class="w-3.5 h-3.5" weight="fill" />
      <span>{{ name }}</span>
    </div>
  </div>
</template>
