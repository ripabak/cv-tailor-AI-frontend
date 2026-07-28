<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  html: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

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

  const style = win.document.createElement('style')
  style.textContent = `
    @page { margin: 0; }
    body { margin: 2cm !important; }
  `
  win.document.head.appendChild(style)

  await new Promise<void>(resolve => {
    win.onload = () => resolve()
    if (win.document.readyState === 'complete') resolve()
  })

  win.focus()
  win.print()
}

defineExpose({ print })
</script>

<template>
  <div class="w-full h-full">
    <iframe
      v-if="html"
      ref="iframeRef"
      :srcdoc="html"
      sandbox="allow-scripts allow-same-origin allow-modals"
      class="w-full h-full border-0"
      title="CV Preview"
    ></iframe>
    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
      <p>CV preview will appear here</p>
    </div>
  </div>
</template>
