<script setup lang="ts">

defineProps<{
  content: string
  isStreaming: boolean
}>()
</script>

<template>
  <div class="flex justify-start gap-3">
    <div class="w-7 h-7 border border-border bg-surface-secondary flex items-center justify-center text-[10px] font-mono tracking-widest text-primary shrink-0">
      AI
    </div>
    <div class="max-w-[85%] border border-border bg-surface-secondary px-4 py-3 text-sm">
      <div class="flex items-center gap-1.5 mb-2 text-[10px] font-mono tracking-widest text-primary">
        <span class="w-2 h-2 border border-primary" :class="isStreaming ? 'animate-pulse bg-primary' : ''" />
        <span>{{ isStreaming ? 'REASONING' : 'THOUGHT' }}</span>
      </div>
      <pre class="whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-text-secondary m-0">{{ content }}</pre>
    </div>
  </div>
</template>
