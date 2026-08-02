<script setup lang="ts">
import { ref, onUpdated } from 'vue'

const props = defineProps<{
  class?: string
}>()

const scrollRef = ref<HTMLDivElement>()

onUpdated(() => {
  const el = scrollRef.value
  if (el) el.scrollTop = el.scrollHeight
})
</script>

<template>
  <div :class="['flex flex-col bg-surface', props.class]">
    <div
      ref="scrollRef"
      class="min-h-0 flex-1 overflow-y-auto px-4 py-5 space-y-5"
    >
      <slot />
    </div>
    <div v-if="$slots.input" class="shrink-0 border-t border-border px-4 py-3 bg-surface-secondary">
      <slot name="input" />
    </div>
  </div>
</template>
