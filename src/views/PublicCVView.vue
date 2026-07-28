<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CVPreviewIframe from '@/components/CVPreviewIframe.vue'
import { api } from '@/composables/useApi'

const route = useRoute()
const slug = route.params.slug as string

const html = ref('')
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const data = await api.get<{ title: string; latest_html: string; display_name: string }>(`/cv/p/${slug}`)
    html.value = data.latest_html
    document.title = data.title
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'CV not found'
  } finally {
    loading.value = false
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
  <div v-else class="h-screen w-screen">
    <CVPreviewIframe :html="html" />
  </div>
</template>
