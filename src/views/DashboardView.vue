<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/composables/useApi'
import NavBar from '@/components/NavBar.vue'
import CVPreviewCard from '@/components/CVPreviewCard.vue'
import Pagination from '@/components/Pagination.vue'
import type { CV, PaginatedResponse } from '@/types'

const router = useRouter()
const cvs = ref<CV[]>([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

async function fetchCVs() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<PaginatedResponse<CV>>(`/cv?page=${page.value}&page_size=9`)
    cvs.value = res.items
    total.value = res.total
    totalPages.value = res.total_pages
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load CVs'
  } finally {
    loading.value = false
  }
}

async function deleteCV(id: number) {
  if (!confirm('Delete this CV?')) return
  try {
    await api.delete(`/cv/${id}`)
    cvs.value = cvs.value.filter(c => c.id !== id)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to delete'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function onPageChange(newPage: number) {
  page.value = newPage
  fetchCVs()
}

onMounted(fetchCVs)
</script>

<template>
  <NavBar />
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">My CVs</h1>
      <router-link
        to="/templates"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Create New CV
      </router-link>
    </div>

    <p v-if="loading" class="text-gray-500">Loading...</p>
    <p v-else-if="error" class="text-red-500">{{ error }}</p>

    <div v-else-if="cvs.length === 0" class="text-center py-12 text-gray-500">
      <p class="text-lg mb-2">No CVs yet</p>
      <p>Click "Create New CV" to get started</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CVPreviewCard
          v-for="cv in cvs"
          :key="cv.id"
          :title="cv.title"
          :html="cv.latest_html"
          :subtitle="`Updated ${formatDate(cv.updated_at)}`"
          @click="router.push(`/editor/${cv.id}`)"
        >
          <template #actions>
            <button
              @click.stop="deleteCV(cv.id)"
              class="text-xs text-red-500 hover:text-red-700"
            >
              Delete
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
