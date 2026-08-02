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
    if (w > 0) scale.value = w / A4_WIDTH
  })
  if (paperRef.value) observer.observe(paperRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div
    class="group border-r border-b border-border bg-surface cursor-pointer transition-colors hover:bg-surface-secondary"
    @click="$emit('click')"
  >
    <!-- Preview -->
    <div class="border-b border-border">
      <div class="aspect-[210/297] bg-surface-secondary overflow-hidden">
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
            class="flex items-center justify-center w-full h-full text-[10px] font-mono tracking-widest text-text-tertiary"
          >
            {{ loading ? '[ LOADING... ]' : '[ NO PREVIEW ]' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="font-sans text-sm font-bold text-text truncate uppercase tracking-tight">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="text-[10px] font-mono tracking-widest text-text-tertiary mt-1">
            {{ subtitle }}
          </p>
        </div>
        <div v-if="$slots.actions" class="flex items-center gap-1 shrink-0" @click.stop>
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>
