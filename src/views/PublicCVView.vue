<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = route.params.slug as string

onMounted(() => {
  window.location.href = `${window.location.origin}/view/${slug}`
})
</script>

<template>
  <div class="h-screen flex items-center justify-center text-gray-500">
    Redirecting...
  </div>
</template>
