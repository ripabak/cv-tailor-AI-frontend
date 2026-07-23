<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CVPreviewIframe from '@/components/CVPreviewIframe.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import VersionPanel from '@/components/VersionPanel.vue'
import NavBar from '@/components/NavBar.vue'
import { useRoute } from 'vue-router'
import { api } from '@/composables/useApi'
import type { CV, CVVersion } from '@/types'
import type { ChatMessage } from '@/types'

const route = useRoute()
const cvId = Number(route.params.cvId)

const cv = ref<CV | null>(null)
const messages = ref<ChatMessage[]>([])
const generatedHtml = ref('')
const loading = ref(true)
const error = ref('')

async function loadCV() {
  loading.value = true
  error.value = ''
  try {
    cv.value = await api.get<CV>(`/cv/${cvId}`)
    generatedHtml.value = cv.value.latest_html || ''
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load CV'
  } finally {
    loading.value = false
  }
}

async function handleSend(prompt: string) {
  messages.value.push({ role: 'user', content: prompt })
  error.value = ''
  try {
    const res = await api.post<{ cv: CV; version: CVVersion }>(`/cv/${cvId}/generate`, { prompt })
    generatedHtml.value = res.version.html_content
    cv.value = res.cv
    messages.value.push({ role: 'ai', content: 'CV updated successfully!' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Generation failed'
    messages.value.push({ role: 'ai', content: `Error: ${msg}` })
  }
}

function handlePrint() {
  const iframe = document.querySelector('iframe') as HTMLIFrameElement | null
  iframe?.contentWindow?.print()
}

onMounted(loadCV)
</script>

<template>
  <NavBar />
  <div v-if="loading" class="flex items-center justify-center h-64 text-gray-500">
    Loading...
  </div>
  <div v-else-if="error" class="flex items-center justify-center h-64 text-red-500">
    {{ error }}
  </div>
  <div v-else class="h-[calc(100vh-61px)] flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
      <h2 class="font-semibold text-gray-800 truncate max-w-md">{{ cv?.title }}</h2>
      <div class="flex gap-2">
        <button
          @click="handlePrint"
          class="border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          Download PDF
        </button>
      </div>
    </div>

    <!-- Split Screen -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Chat -->
      <div class="w-[400px] border-r border-gray-200 flex flex-col">
        <ChatPanel :messages="messages" @send="handleSend" />
      </div>
      <!-- Right: Preview + Versions -->
      <div class="flex-1 flex flex-col">
        <div class="flex-1">
          <CVPreviewIframe :html="generatedHtml" />
        </div>
        <div class="h-48 border-t border-gray-200 overflow-y-auto">
          <VersionPanel :cv-id="cvId" :current-html="generatedHtml" @restored="loadCV" />
        </div>
      </div>
    </div>
  </div>
</template>
