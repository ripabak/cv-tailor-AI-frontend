<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  html: string
  scale?: number
}>(), {
  scale: 1,
})

const iframeRef = ref<HTMLIFrameElement | null>(null)

const zoomStyle = computed(() => ({
  zoom: props.scale,
}))

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

defineExpose({ print })
</script>

<template>
  <div class="w-full h-full overflow-auto">
    <iframe
      v-if="html"
      ref="iframeRef"
      :srcdoc="html"
      sandbox="allow-scripts allow-same-origin allow-modals"
      :style="zoomStyle"
      class="border-0"
      style="width: 100%; height: 100%;"
      title="CV Preview"
    ></iframe>
    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
      <p>CV preview will appear here</p>
    </div>
  </div>
</template>
