<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <div class="w-full h-full">
    <iframe
      v-if="html"
      :srcdoc="html"
      sandbox="allow-scripts allow-popups"
      class="w-full h-full border-0"
      title="CV Preview"
    ></iframe>
    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
      <p>CV preview will appear here</p>
    </div>
  </div>
</template>
