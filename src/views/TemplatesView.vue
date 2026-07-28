<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/composables/useApi'
import NavBar from '@/components/NavBar.vue'
import CVPreviewCard from '@/components/CVPreviewCard.vue'
import Pagination from '@/components/Pagination.vue'
import type { Template, PaginatedResponse } from '@/types'

const router = useRouter()
const templates = ref<Template[]>([])
const loading = ref(true)
const error = ref('')
const generating = ref(false)
const page = ref(1)
const totalPages = ref(1)

async function fetchTemplates() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<PaginatedResponse<Template>>(`/templates?page=${page.value}&page_size=9`)
    templates.value = res.items
    totalPages.value = res.total_pages
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

function onPageChange(newPage: number) {
  page.value = newPage
  fetchTemplates()
}

onMounted(fetchTemplates)
</script>

<template>
  <NavBar />
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Choose a Template</h1>

    <p v-if="loading" class="text-gray-500">Loading...</p>
    <p v-else-if="error" class="text-red-500">{{ error }}</p>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CVPreviewCard
          v-for="tpl in templates"
          :key="tpl.id"
          :title="tpl.title"
          :html="tpl.html_code"
          subtitle="A4 format with Tailwind CSS styling"
          @click="createCV(tpl.id)"
        >
          <template #actions>
            <button
              @click.stop="createCV(tpl.id)"
              :disabled="generating"
              class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {{ generating ? 'Creating...' : 'Use This Template' }}
            </button>
          </template>
        </CVPreviewCard>
      </div>

      <Pagination
        v-if="totalPages > 1"
        :page="page"
        :total-pages="totalPages"
        @change="onPageChange"
      />
    </template>
  </div>
</template>
