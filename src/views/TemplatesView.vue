<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/composables/useApi'
import NavBar from '@/components/NavBar.vue'
import type { Template } from '@/types'

const router = useRouter()
const templates = ref<Template[]>([])
const loading = ref(true)
const error = ref('')
const generating = ref(false)

async function fetchTemplates() {
  loading.value = true
  error.value = ''
  try {
    templates.value = await api.get<Template[]>('/templates')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load templates'
  } finally {
    loading.value = false
  }
}

async function createCV(templateId: number) {
  generating.value = true
  try {
    const res = await api.post<{ id: number; latest_html: string }>('/cv', {
      template_id: templateId,
    })
    router.push(`/editor/${res.id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create CV'
  } finally {
    generating.value = false
  }
}

onMounted(fetchTemplates)
</script>

<template>
  <NavBar />
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Choose a Template</h1>

    <p v-if="loading" class="text-gray-500">Loading...</p>
    <p v-else-if="error" class="text-red-500">{{ error }}</p>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="border border-gray-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all"
      >
        <h3 class="font-semibold text-lg text-gray-800">{{ tpl.title }}</h3>
        <p class="text-sm text-gray-500 mt-1">A4 format with Tailwind CSS styling</p>
        <button
          @click="createCV(tpl.id)"
          :disabled="generating"
          class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {{ generating ? 'Creating...' : 'Use This Template' }}
        </button>
      </div>
    </div>
  </div>
</template>
