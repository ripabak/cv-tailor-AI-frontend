<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  html: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

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
    <iframe
      ref="iframeRef"
      v-if="html"
      :srcdoc="html"
      sandbox="allow-scripts allow-same-origin allow-modals"
      class="block border-0 w-full h-full"
      title="CV Preview"
    />
    <div v-else class="flex items-center justify-center text-gray-400 h-full">
      <p>CV preview will appear here</p>
    </div>
  </div>
</template>
