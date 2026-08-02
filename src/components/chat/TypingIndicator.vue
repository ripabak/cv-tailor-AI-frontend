<script setup lang="ts">
</script>

<template>
  <div class="flex justify-start">
    <div class="border border-border bg-surface-secondary px-4 py-3">
      <div class="flex gap-1.5">
        <span
          v-for="i in [0, 1, 2]"
          :key="i"
          class="w-1.5 h-1.5 border border-primary animate-pulse"
          :class="i === 1 ? 'bg-primary' : ''"
          :style="{ animationDelay: `${i * 150}ms` }"
        />
      </div>
    </div>
  </div>
</template>
