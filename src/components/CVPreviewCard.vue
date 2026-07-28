<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  title: string
  html?: string | null
  subtitle?: string
  loading?: boolean
}>()

defineEmits<{ click: [] }>()

const paperRef = ref<HTMLDivElement>()
const scale = ref(0.25)

let observer: ResizeObserver | null = null

const A4_WIDTH = 794
const A4_HEIGHT = 1123

const PREVIEW_STYLES = `<style>
body { margin: 0 !important; }
.print-mimic { margin: 0 !important; box-shadow: none !important; border: none !important; }
</style>`

const previewHtml = computed(() => {
  if (!props.html) return ''
  return props.html.replace('<html', PREVIEW_STYLES + '<html')
})

onMounted(() => {
  observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const w = entry.contentRect.width
    if (w > 0) {
      scale.value = w / A4_WIDTH
    }
  })
  if (paperRef.value) {
    observer.observe(paperRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div
    class="bg-gray-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    @click="$emit('click')"
  >
    <div class="px-4 pt-4 pb-0">
      <div
        class="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.12)] overflow-hidden"
        style="aspect-ratio: 210 / 297"
      >
        <div ref="paperRef" class="relative w-full h-full">
          <div
            v-if="previewHtml"
            class="absolute top-0 left-0"
            :style="{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: A4_WIDTH + 'px',
              height: A4_HEIGHT + 'px',
            }"
          >
            <iframe
              :srcdoc="previewHtml"
              sandbox="allow-scripts"
              class="border-0 pointer-events-none"
              :style="{ width: A4_WIDTH + 'px', height: A4_HEIGHT + 'px' }"
            />
          </div>
          <div
            v-else
            class="flex items-center justify-center w-full h-full text-gray-400 text-sm p-4 text-center"
          >
            {{ loading ? 'Loading...' : 'No preview' }}
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 pb-4 pt-3">
      <h3 class="font-semibold text-gray-800 truncate text-[15px]">
        {{ title }}
      </h3>
      <p v-if="subtitle" class="text-xs text-gray-500 mt-0.5">
        {{ subtitle }}
      </p>
      <div v-if="$slots.actions" class="flex justify-end mt-2.5" @click.stop>
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
