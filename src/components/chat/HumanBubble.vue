<script setup lang="ts">
</script>

<template>
  <div class="flex justify-end gap-3">
    <div class="max-w-[85%] border border-primary bg-primary text-primary-on px-4 py-3 text-sm leading-relaxed normal-case">
      <slot />
    </div>
    <div class="w-7 h-7 border border-border bg-surface-secondary flex items-center justify-center text-[10px] font-mono tracking-widest text-text-secondary shrink-0">
      OP
    </div>
  </div>
</template>
