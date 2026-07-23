<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/composables/useApi'
import NavBar from '@/components/NavBar.vue'
import type { CV } from '@/types'

const router = useRouter()
const cvs = ref<CV[]>([])
const loading = ref(true)
const error = ref('')

async function fetchCVs() {
  loading.value = true
  error.value = ''
  try {
    cvs.value = await api.get<CV[]>('/cv')
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

onMounted(fetchCVs)
</script>

<template>
  <NavBar />
  <div class="max-w-4xl mx-auto p-6">
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

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="cv in cvs"
        :key="cv.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="router.push(`/editor/${cv.id}`)"
      >
        <h3 class="font-semibold text-gray-800 truncate">{{ cv.title }}</h3>
        <p class="text-sm text-gray-500 mt-1">Updated {{ formatDate(cv.updated_at) }}</p>
        <div class="flex justify-end mt-3">
          <button
            @click.stop="deleteCV(cv.id)"
            class="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
