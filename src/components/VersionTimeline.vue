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
    class="flex items-center gap-3 px-3 py-2 border-b border-border bg-surface-secondary overflow-x-auto"
  >
    <span class="text-[10px] font-mono tracking-widest text-text-tertiary shrink-0">[ VERSIONS ]</span>
    <div class="flex items-center gap-0">
      <div
        v-for="(v, i) in [...versions].reverse().map((v, ri) => ({ v, originalIndex: versions.length - 1 - ri }))"
        :key="v.v.id"
        class="w-2 h-2 border border-border shrink-0 transition-colors"
        :class="{
          'bg-primary border-primary': v.originalIndex === currentIndex,
          'bg-surface-tertiary': v.originalIndex > currentIndex,
          'bg-primary/50': v.originalIndex < currentIndex,
        }"
        :title="new Date(v.v.created_at).toLocaleString()"
      />
    </div>
  </div>
</template>
