<script setup lang="ts">
</script>

<template>
  <div class="flex justify-end items-end gap-2">
    <div class="max-w-[80%] rounded-xl rounded-br-sm bg-primary-dark text-white px-4 py-3 text-sm leading-relaxed">
      <slot />
    </div>
    <div class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-surface-tertiary border border-border">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  </div>
</template>
