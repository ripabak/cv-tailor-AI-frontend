<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/composables/useApi'

const route = useRoute()
const slug = route.params.slug as string

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const data = await api.get<{ title: string; latest_html: string }>(`/cv/p/${slug}`)
    document.open()
    document.write(data.latest_html)
    document.close()
  } catch (e: unknown) {
    loading.value = false
    error.value = e instanceof Error ? e.message : 'CV not found'
  }
})
</script>

<template>
  <div v-if="loading" class="h-screen flex items-center justify-center text-gray-500">
    Loading...
  </div>
  <div v-else-if="error" class="h-screen flex items-center justify-center text-red-500">
    {{ error }}
  </div>
</template>
