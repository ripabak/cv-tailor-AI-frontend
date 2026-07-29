<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  html: string
  scale?: number
}>(), {
  scale: 1,
})

const iframeRef = ref<HTMLIFrameElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const scaledHtml = computed(() => {
  if (props.scale === 1) return props.html
  return props.html.replace(
    '</head>',
    `<style>
      .print-mimic{zoom:${props.scale}}
    </style>\n</head>`
  )
})

function saveScroll() {
  const container = containerRef.value
  const containerTop = container?.scrollTop ?? 0

  let iframeRatio = 0
  const win = iframeRef.value?.contentWindow
  if (win) {
    const doc = win.document.documentElement
    const sh = doc.scrollHeight
    iframeRatio = sh > 0 ? win.scrollY / sh : 0
  }

  return { containerTop, iframeRatio }
}

function restoreScroll(state: { containerTop: number; iframeRatio: number } | undefined) {
  if (!state) return

  const container = containerRef.value
  if (container) {
    container.scrollTop = state.containerTop
  }

  const win = iframeRef.value?.contentWindow
  if (win) {
    const newHeight = win.document.documentElement.scrollHeight
    win.scrollTo(0, newHeight * state.iframeRatio)
  }
}

async function print() {
  if (!iframeRef.value) return

  const doc = iframeRef.value.contentDocument
  const html = doc ? doc.documentElement.outerHTML : iframeRef.value.srcdoc

  const win = window.open('about:blank', '_blank')
  if (!win) {
    iframeRef.value.contentWindow?.print()
    return
  }

  win.document.write(html)
  win.document.close()

  await new Promise<void>(resolve => {
    win.onload = () => resolve()
    if (win.document.readyState === 'complete') resolve()
  })

  win.focus()
  win.print()
}

defineExpose({ print, saveScroll, restoreScroll, iframeRef })
</script>

<template>
  <div ref="containerRef" class="w-full h-full overflow-auto">
    <iframe
      v-if="html"
      ref="iframeRef"
      :srcdoc="scaledHtml"
      sandbox="allow-scripts allow-same-origin allow-modals"
      class="border-0"
      style="width: 100%; height: 100%;"
      title="CV Preview"
    ></iframe>
    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
      <p>CV preview will appear here</p>
    </div>
  </div>
</template>
