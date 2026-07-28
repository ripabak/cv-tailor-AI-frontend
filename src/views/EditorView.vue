<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import CVPreviewIframe from '@/components/CVPreviewIframe.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import VersionTimeline from '@/components/VersionTimeline.vue'
import NavBar from '@/components/NavBar.vue'
import { useRoute } from 'vue-router'
import { api } from '@/composables/useApi'
import { useChat } from '@/composables/useChat'
import type { CV, CVVersion } from '@/types'

const route = useRoute()
const cvId = ref(Number(route.params.cvId))
const mobileTab = ref<'chat' | 'preview'>('chat')

const { messages, isStreaming, loadHistory, send, stop, clear } = useChat(cvId)

const cv = ref<CV | null>(null)
const generatedHtml = ref('')
const loading = ref(true)
const error = ref('')

const versions = ref<CVVersion[]>([])
const versionIndex = ref(0)

const canUndo = () => versionIndex.value < activeVersions.value.length - 1
const canRedo = () => versionIndex.value > 0

function getActiveLineage(allVersions: CVVersion[], currentId: number | null | undefined): CVVersion[] {
  const versionMap = new Map<number, CVVersion>()
  for (const v of allVersions) {
    versionMap.set(v.id, v)
  }
  const lineage: CVVersion[] = []
  let nextId: number | null | undefined = currentId
  while (nextId != null) {
    const v = versionMap.get(nextId)
    if (!v) break
    lineage.push(v)
    nextId = v.parent_version_id
  }
  return lineage
}

const activeVersions = computed(() => getActiveLineage(versions.value, cv.value?.current_version_id))

let lastMessagesLength = 0

watch(() => messages.value.length, (len) => {
  if (len > lastMessagesLength) {
    lastMessagesLength = len
    loadCVSilent()
  }
})

watch(isStreaming, (streaming) => {
  if (!streaming) loadCVSilent()
})

async function loadVersions() {
  try {
    versions.value = await api.get<CVVersion[]>(`/cv/${cvId.value}/versions`)
  } catch {
    // silent
  }
}

async function loadCV() {
  loading.value = true
  error.value = ''
  try {
    cv.value = await api.get<CV>(`/cv/${cvId.value}`)
    generatedHtml.value = cv.value.latest_html || ''
    await loadVersions()
    versionIndex.value = 0
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load CV'
  } finally {
    loading.value = false
  }
}

async function loadCVSilent() {
  try {
    const updated = await api.get<CV>(`/cv/${cvId.value}`)
    if (updated.latest_html && updated.latest_html !== generatedHtml.value) {
      generatedHtml.value = updated.latest_html
      cv.value = updated
      await loadVersions()
      versionIndex.value = 0
    }
  } catch {
    // silent refresh
  }
}

async function handleSend(prompt: string) {
  if (versionIndex.value > 0) {
    const targetVersion = activeVersions.value[versionIndex.value]
    if (targetVersion) {
      try {
        await api.post(`/cv/${cvId.value}/versions/${targetVersion.id}/revert`)
        await loadVersions()
        versionIndex.value = 0
        generatedHtml.value = targetVersion.html_content
      } catch {
        // proceed with send even if revert fails
      }
    }
  }
  send(prompt)
}

function handleUndo() {
  if (canUndo()) {
    versionIndex.value++
    generatedHtml.value = activeVersions.value[versionIndex.value]?.html_content ?? generatedHtml.value
  }
}

function handleRedo() {
  if (canRedo()) {
    versionIndex.value--
    generatedHtml.value = activeVersions.value[versionIndex.value]?.html_content ?? generatedHtml.value
  }
}

function handlePrint() {
  const iframe = document.querySelector('iframe') as HTMLIFrameElement | null
  iframe?.contentWindow?.print()
}

onMounted(async () => {
  await loadCV()
  await loadHistory()
})
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
          @click="handleUndo"
          :disabled="!canUndo()"
          class="border border-gray-300 px-2 py-1 rounded text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          @click="handleRedo"
          :disabled="!canRedo()"
          class="border border-gray-300 px-2 py-1 rounded text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <button
          @click="handlePrint"
          class="border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          Download PDF
        </button>
      </div>
    </div>

    <!-- Version Timeline -->
    <VersionTimeline :versions="activeVersions" :current-index="versionIndex" />

    <!-- Mobile tab selector -->
    <div class="lg:hidden flex border-b border-gray-200 bg-white">
      <button
        @click="mobileTab = 'chat'"
        class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
        :class="mobileTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
      >
        Chat
      </button>
      <button
        @click="mobileTab = 'preview'"
        class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
        :class="mobileTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
      >
        CV Preview
      </button>
    </div>

    <!-- Split Screen -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Chat -->
      <div
        class="w-[400px] border-r border-gray-200 max-lg:w-full max-lg:border-r-0"
        :class="mobileTab === 'chat' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'"
      >
        <ChatPanel
          :messages="messages"
          :is-streaming="isStreaming"
          @send="handleSend"
          @clear="clear"
          @stop="stop"
        />
      </div>
      <!-- Right: Preview + Versions -->
      <div
        class="flex-1"
        :class="mobileTab === 'preview' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'"
      >
        <div class="flex-1">
          <CVPreviewIframe :html="generatedHtml" />
        </div>
      </div>
    </div>
  </div>
</template>
