<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  html: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

function saveScroll() {
  const doc = iframeRef.value?.contentDocument
  const el = doc?.documentElement
  return { top: el?.scrollTop ?? 0, left: el?.scrollLeft ?? 0 }
}

function restoreScroll(state: { top: number; left: number } | undefined) {
  if (!state) return
  const doc = iframeRef.value?.contentDocument
  if (doc?.documentElement) {
    doc.documentElement.scrollTop = state.top
    doc.documentElement.scrollLeft = state.left
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
  <div class="w-full h-full bg-surface border border-border">
    <iframe
      v-if="html"
      ref="iframeRef"
      :srcdoc="html"
      sandbox="allow-scripts allow-same-origin allow-modals"
      class="block border-0 w-full h-full"
      title="CV Preview"
    />
    <div
      v-else
      class="flex items-center justify-center h-full p-4 text-[10px] font-mono tracking-widest text-text-tertiary"
    >
      [ CV PREVIEW WILL APPEAR HERE ]
    </div>
  </div>
</template>
