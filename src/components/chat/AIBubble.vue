<script setup lang="ts">
</script>

<template>
  <div class="flex justify-start gap-3">
    <div class="w-7 h-7 border border-border bg-surface-secondary flex items-center justify-center text-[10px] font-mono tracking-widest text-primary shrink-0">
      AI
    </div>
    <div class="max-w-[85%] border border-border bg-surface-secondary px-4 py-3 text-sm leading-relaxed normal-case">
      <slot />
    </div>
  </div>
</template>
