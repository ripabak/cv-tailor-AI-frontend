<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/composables/useApi'
import type { CVVersion } from '@/types'

const props = defineProps<{
  cvId: number
  currentHtml: string
}>()

const emit = defineEmits<{
  restored: []
}>()

const versions = ref<CVVersion[]>([])
const loading = ref(false)
const error = ref('')
const restoring = ref<number | null>(null)

async function fetchVersions() {
  loading.value = true
  error.value = ''
  try {
    versions.value = await api.get<CVVersion[]>(`/cv/${props.cvId}/versions`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load versions'
  } finally {
    loading.value = false
  }
}

async function restoreVersion(versionId: number) {
  restoring.value = versionId
  try {
    await api.post(`/cv/${props.cvId}/versions/${versionId}/revert`)
    emit('restored')
    await fetchVersions()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to restore'
  } finally {
    restoring.value = null
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchVersions)
</script>

<template>
  <div class="p-3">
    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Version History</h4>
    <p v-if="loading" class="text-xs text-gray-400">Loading...</p>
    <p v-else-if="error" class="text-xs text-red-500">{{ error }}</p>
    <div v-else class="space-y-1">
      <div
        v-for="v in versions"
        :key="v.id"
        class="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50"
        :class="{ 'bg-blue-50': v.html_content === currentHtml }"
      >
        <span class="text-gray-600">{{ formatDate(v.created_at) }}</span>
        <button
          @click="restoreVersion(v.id)"
          :disabled="restoring === v.id || v.html_content === currentHtml"
          class="text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          {{ restoring === v.id ? 'Restoring...' : v.html_content === currentHtml ? 'Current' : 'Restore' }}
        </button>
      </div>
    </div>
  </div>
</template>
