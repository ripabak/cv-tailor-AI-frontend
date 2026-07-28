<script setup lang="ts">
import type { CVVersion } from '@/types'

defineProps<{
  versions: CVVersion[]
  currentIndex: number
}>()
</script>

<template>
  <div
    v-if="versions.length > 0"
    class="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 bg-gray-50 overflow-x-auto"
  >
    <span class="text-xs text-gray-400 font-medium shrink-0 mr-1">History</span>
    <div class="flex items-center gap-1">
      <div
        v-for="(v, i) in [...versions].reverse().map((v, ri) => ({ v, originalIndex: versions.length - 1 - ri }))"
        :key="v.v.id"
        class="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
        :class="{
          'bg-blue-600 ring-2 ring-blue-200': v.originalIndex === currentIndex,
          'bg-gray-300': v.originalIndex > currentIndex,
          'bg-blue-300': v.originalIndex < currentIndex,
        }"
        :title="new Date(v.v.created_at).toLocaleString()"
      />
    </div>
  </div>
</template>
