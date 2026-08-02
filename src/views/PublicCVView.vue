<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = route.params.slug as string

const BACKEND_URL = (import.meta.env.VITE_API_URL || (window as any).__APP_CONFIG__?.API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')

onMounted(() => {
  window.location.href = `${BACKEND_URL}/view/${slug}`
})
</script>

<template>
  <div class="min-h-[100dvh] flex items-center justify-center text-[10px] font-mono tracking-widest text-text-tertiary">
    [ REDIRECTING... ]
  </div>
</template>
