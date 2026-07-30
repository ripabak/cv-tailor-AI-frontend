<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import CVPreviewIframe from '@/components/CVPreviewIframe.vue'
import MobileCVPreview from '@/components/MobileCVPreview.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import VersionTimeline from '@/components/VersionTimeline.vue'
import NavBar from '@/components/NavBar.vue'
import ShareModal from '@/components/ShareModal.vue'
import { useRoute } from 'vue-router'
import { api } from '@/composables/useApi'
import { useChat } from '@/composables/useChat'
import type { CV, CVVersion } from '@/types'

const BACKEND_URL = (import.meta.env.VITE_API_URL || (window as any).__APP_CONFIG__?.API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')

const route = useRoute()
const cvId = ref(Number(route.params.cvId))
const mobileTab = ref<'chat' | 'preview'>('chat')

const { messages, isStreaming, totalUsage, loadHistory, send, stop, clear } = useChat(cvId)

const splitPercent = ref(30)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartPercent = ref(30)
const splitContainer = ref<HTMLDivElement>()
const chatPanelRef = ref<HTMLDivElement>()
const previewPanelRef = ref<HTMLDivElement>()
const dragHandleRef = ref<HTMLDivElement>()
const isDesktop = ref(window.matchMedia('(min-width: 1024px)').matches)

const chatWidthStyle = computed(() => {
  if (!isDesktop.value) return undefined
  return { flex: 'none', width: `${splitPercent.value}%` }
})


function startDrag(e: PointerEvent) {
  e.preventDefault()
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartPercent.value = splitPercent.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  dragHandleRef.value?.setPointerCapture(e.pointerId)
}

function onDrag(e: PointerEvent) {
  if (!isDragging.value || !splitContainer.value) return
  const rect = splitContainer.value.getBoundingClientRect()
  const deltaPct = ((e.clientX - dragStartX.value) / rect.width) * 100
  splitPercent.value = Math.max(20, Math.min(70, dragStartPercent.value + deltaPct))
}

function stopDrag(e: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  try {
    dragHandleRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    // ignore
  }
}

onMounted(async () => {
  const mql = window.matchMedia('(min-width: 1024px)')
  isDesktop.value = mql.matches
  mql.addEventListener('change', (e) => { isDesktop.value = e.matches })
  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', stopDrag)
  document.addEventListener('pointercancel', stopDrag)
  await loadCV()
  await loadHistory()
})

onUnmounted(() => {
  const mql = window.matchMedia('(min-width: 1024px)')
  mql.removeEventListener('change', (e) => { isDesktop.value = e.matches })
  document.removeEventListener('pointermove', onDrag)
  document.removeEventListener('pointerup', stopDrag)
  document.removeEventListener('pointercancel', stopDrag)
})

const cv = ref<CV | null>(null)
const generatedHtml = ref('')
const loading = ref(true)
const error = ref('')

const editingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
const titleDraft = ref('')
const savingTitle = ref(false)

function startEditingTitle() {
  if (!cv.value) return
  titleDraft.value = cv.value.title
  editingTitle.value = true
  requestAnimationFrame(() => titleInput.value?.focus())
}

async function saveTitle() {
  if (!cv.value || !titleDraft.value.trim()) return
  savingTitle.value = true
  try {
    const updated = await api.patch<CV>(`/cv/${cvId.value}`, { title: titleDraft.value.trim() })
    cv.value = updated
    editingTitle.value = false
  } catch {
    // silent
  } finally {
    savingTitle.value = false
  }
}

function cancelEditTitle() {
  editingTitle.value = false
}

const versions = ref<CVVersion[]>([])
const publishing = ref(false)
const showShareModal = ref(false)
const publicUrl = computed(() => {
  if (!cv.value?.public_slug) return ''
  return `${BACKEND_URL}/view/${cv.value.public_slug}`
})

const canUndo = computed(() => {
  if (!cv.value?.current_version_id) return false
  const current = versions.value.find(v => v.id === cv.value!.current_version_id)
  return current?.parent_version_id != null
})

const canRedo = computed(() => {
  if (!cv.value?.current_version_id) return false
  return versions.value.some(v => v.parent_version_id === cv.value!.current_version_id)
})

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
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load CV'
  } finally {
    loading.value = false
  }
}

async function loadCVSilent() {
  try {
    const updated = await api.get<CV>(`/cv/${cvId.value}`)
    const htmlChanged = updated.latest_html && updated.latest_html !== generatedHtml.value
    const titleChanged = updated.title !== cv.value?.title
    if (htmlChanged || titleChanged) {
      generatedHtml.value = updated.latest_html || generatedHtml.value
      cv.value = updated
      if (htmlChanged) await loadVersions()
    }
  } catch {
    // silent refresh
  }
}

async function handleSend(prompt: string) {
  send(prompt)
}

async function handleUndo() {
  if (!canUndo.value || !cv.value?.current_version_id) return
  const current = versions.value.find(v => v.id === cv.value!.current_version_id)
  if (!current?.parent_version_id) return
  const parent = versions.value.find(v => v.id === current.parent_version_id)
  if (!parent) return
  try {
    pendingScrollState = savePreviewScroll()
    console.log('[EditorView] undo saveScroll:', pendingScrollState)
    await api.post(`/cv/${cvId.value}/versions/${parent.id}/revert`)
    cv.value = await api.get<CV>(`/cv/${cvId.value}`)
    generatedHtml.value = parent.html_content
    console.log('[EditorView] undo generatedHtml set, calling restorePreviewScroll')
    restorePreviewScroll()
    await loadVersions()
  } catch {
    // silent
  }
}

async function handleRedo() {
  if (!canRedo.value || !cv.value?.current_version_id) return
  const child = versions.value.find(v => v.parent_version_id === cv.value!.current_version_id)
  if (!child) return
  try {
    pendingScrollState = savePreviewScroll()
    await api.post(`/cv/${cvId.value}/versions/${child.id}/revert`)
    cv.value = await api.get<CV>(`/cv/${cvId.value}`)
    generatedHtml.value = child.html_content
    restorePreviewScroll()
    await loadVersions()
  } catch {
    // silent
  }
}

let pendingScrollState: ReturnType<typeof savePreviewScroll> = undefined

function savePreviewScroll() {
  const state = previewRef.value?.saveScroll()
  console.log('[EditorView] savePreviewScroll:', state)
  return state
}

function restorePreviewScroll() {
  const iframeEl = previewRef.value?.iframeRef
  console.log('[EditorView] restorePreviewScroll, iframeEl:', !!iframeEl, 'pending:', pendingScrollState)
  if (!iframeEl) return

  const onLoad = () => {
    console.log('[EditorView] iframe load event fired')
    iframeEl.removeEventListener('load', onLoad)
    previewRef.value?.restoreScroll(pendingScrollState)
    pendingScrollState = undefined
    console.log('[EditorView] restoreScroll called, pending cleared')
  }

  iframeEl.addEventListener('load', onLoad)
}

const previewRef = ref<any>(null)

function handlePrint() {
  previewRef.value?.print()
}

async function togglePublish() {
  if (!cv.value) return
  publishing.value = true
  try {
    if (cv.value.is_published) {
      await api.post(`/cv/${cvId.value}/unpublish`)
      cv.value.is_published = false
      cv.value.public_slug = null
    } else {
      const res = await api.post<{ slug: string; url: string }>(`/cv/${cvId.value}/publish`)
      cv.value.is_published = true
      cv.value.public_slug = res.slug
      showShareModal.value = true
    }
  } catch {
    // error handled silently
  } finally {
    publishing.value = false
  }
}

function openShare() {
  if (cv.value?.public_slug) {
    showShareModal.value = true
  }
}
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
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white gap-3 overflow-x-auto">
      <div class="min-w-0 flex-shrink-0">
        <div v-if="editingTitle" class="flex items-center gap-2">
          <input
            ref="titleInput"
            v-model="titleDraft"
            @keydown.enter="saveTitle"
            @keydown.escape="cancelEditTitle"
            @blur="saveTitle"
            :disabled="savingTitle"
            class="font-semibold text-gray-800 bg-transparent appearance-none shadow-none focus:shadow-none focus:outline-none focus:ring-0 border-0 outline-0 ring-0 px-0 py-0.5 w-full max-w-[140px] sm:max-w-xs lg:max-w-md" style="border: none; outline: none; box-shadow: none;"
            maxlength="200"
          />
        </div>
        <h2
          v-else
          @click="startEditingTitle"
          class="font-semibold text-gray-800 truncate max-w-[140px] sm:max-w-xs lg:max-w-md cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to rename"
        >
          {{ cv?.title }}
        </h2>
      </div>
      <div class="flex items-center gap-1.5 overflow-x-auto flex-shrink-0">
        <button
          @click="handleUndo"
          :disabled="!canUndo"
          class="flex items-center justify-center border border-gray-300 p-1.5 rounded-md text-sm hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="Undo"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          @click="handleRedo"
          :disabled="!canRedo"
          class="flex items-center justify-center border border-gray-300 p-1.5 rounded-md text-sm hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="Redo"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <button
          @click="handlePrint"
          class="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 transition-colors flex-shrink-0 text-gray-700 font-medium"
          title="Download PDF"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span class="hidden lg:inline">Download PDF</span>
        </button>
        <button
          v-if="cv?.is_published"
          @click="openShare"
          class="flex items-center justify-center border border-gray-300 p-1.5 rounded-md text-sm hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Share link"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
        <button
          @click="togglePublish"
          :disabled="publishing"
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex-shrink-0"
          :class="cv?.is_published
            ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
            : 'bg-blue-600 text-white hover:bg-blue-700'"
          :title="cv?.is_published ? 'Unpublish' : 'Publish'"
        >
          <svg v-if="cv?.is_published" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <svg v-else class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span class="hidden lg:inline whitespace-nowrap">{{ publishing ? '...' : cv?.is_published ? 'Unpublish' : 'Publish' }}</span>
        </button>
      </div>
    </div>

    <!-- Version Timeline -->
    <VersionTimeline :versions="activeVersions" :current-index="0" />

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
    <div ref="splitContainer" class="flex-1 flex overflow-hidden relative">
      <!-- Left: Chat -->
      <div
        ref="chatPanelRef"
        class="border-r border-gray-200 max-lg:w-full max-lg:border-r-0 min-h-0 min-w-0 overflow-hidden"
        :class="mobileTab === 'chat' ? 'flex flex-col max-lg:flex-1' : 'hidden lg:flex lg:flex-col'"
        :style="chatWidthStyle"
      >
        <ChatPanel
          :messages="messages"
          :is-streaming="isStreaming"
          :total-usage="totalUsage"
          @send="handleSend"
          @clear="clear"
          @stop="stop"
        />
      </div>
      <!-- Drag Handle (desktop only) -->
      <div
        ref="dragHandleRef"
        class="hidden lg:flex w-3 cursor-col-resize shrink-0 relative group items-center justify-center -ml-[1.5px] z-10"
        @pointerdown="startDrag"
      >
        <div class="h-8 w-0.5 rounded-full bg-gray-300 group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors" />
      </div>
      <!-- Right: Preview + Versions -->
      <div
        ref="previewPanelRef"
        class="flex-1 min-h-0"
        :class="mobileTab === 'preview' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'"
      >
        <div class="flex-1 min-h-0">
          <CVPreviewIframe v-if="isDesktop" ref="previewRef" :html="generatedHtml" />
          <MobileCVPreview v-else ref="previewRef" :html="generatedHtml" />
        </div>
      </div>
      <!-- Drag overlay: blocks iframe mouse capture during drag -->
      <div
        v-show="isDragging"
        class="absolute inset-0 z-50 pointer-events-auto"
      />
    </div>
    <ShareModal
      :visible="showShareModal"
      :url="publicUrl"
      @close="showShareModal = false"
    />
  </div>
</template>
