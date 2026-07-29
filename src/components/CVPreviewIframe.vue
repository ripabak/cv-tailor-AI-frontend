<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  html: string
}>()

const A4_WIDTH = 794
const A4_HEIGHT = 1123

const iframeRef = ref<HTMLIFrameElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const scale = ref(0.25)
let observer: ResizeObserver | null = null

onMounted(() => {
  observer = new ResizeObserver(entries => {
    const entry = entries[0]
    if (!entry) return
    const w = entry.contentRect.width
    if (w > 0) {
      scale.value = w / A4_WIDTH
    }
  })
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const paperStyle = computed(() => ({
  zoom: scale.value,
  transformOrigin: 'top left',
  width: A4_WIDTH + 'px',
  height: A4_HEIGHT + 'px',
}))

function saveScroll() {
  const container = containerRef.value
  return { containerTop: container?.scrollTop ?? 0, containerLeft: container?.scrollLeft ?? 0 }
}

function restoreScroll(state: { containerTop: number; containerLeft: number } | undefined) {
  if (!state) return
  const container = containerRef.value
  if (container) {
    container.scrollTop = state.containerTop
    container.scrollLeft = state.containerLeft
  }
}

async function print() {
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(props.html)
    win.document.close()
    await new Promise<void>(resolve => {
      win.onload = () => resolve()
      if (win.document.readyState === 'complete') resolve()
    })
    win.focus()
    win.print()
  }
}

defineExpose({ print, saveScroll, restoreScroll, iframeRef })
</script>

<template>
  <div ref="containerRef" class="w-full h-full overflow-auto">
    <div
      v-if="html"
      :style="paperStyle"
    >
      <iframe
        ref="iframeRef"
        :srcdoc="html"
        sandbox="allow-scripts allow-same-origin allow-modals"
        class="block border-0"
        :style="{ width: '100%', height: '100%' }"
        title="CV Preview"
      />
    </div>
    <div v-else class="flex items-center justify-center text-gray-400 h-full">
      <p>CV preview will appear here</p>
    </div>
  </div>
</template>
