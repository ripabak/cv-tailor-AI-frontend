<script setup lang="ts">
import { ref, shallowRef, watch, onUnmounted } from 'vue'
import { loadModule } from 'vue3-sfc-loader'
import * as Vue from 'vue'

const props = defineProps<{
  code: string
}>()

const error = ref('')
const CompiledComponent = shallowRef<any>(null)
const loading = ref(false)

// Track injected <style> elements to clean them up on re-compile
const styleElements: HTMLStyleElement[] = []

async function compile(code: string) {
  if (!code.trim()) {
    CompiledComponent.value = null
    return
  }

  loading.value = true
  error.value = ''

  // Remove styles from previous compilation
  styleElements.forEach(el => el.remove())
  styleElements.length = 0

  try {
    const component = await loadModule('/render.vue', {
      // Provide the Vue runtime so SFC imports like `import { ref } from 'vue'` resolve
      moduleCache: { vue: Vue },
      // Return the raw SFC string when the loader requests the "file"
      async getFile(_url: string) {
        return code
      },
      // Inject <style> blocks into the document head
      addStyle(textContent: string) {
        const style = Object.assign(document.createElement('style'), { textContent })
        const ref = document.head.getElementsByTagName('style')[0] || null
        document.head.insertBefore(style, ref)
        styleElements.push(style)
      },
    })
    CompiledComponent.value = component
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Compilation failed'
    CompiledComponent.value = null
  } finally {
    loading.value = false
  }
}

// Debounce compilation to avoid rapid re-compiles
let compileTimer: ReturnType<typeof setTimeout>
watch(
  () => props.code,
  (newCode) => {
    clearTimeout(compileTimer)
    compileTimer = setTimeout(() => compile(newCode), 100)
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimeout(compileTimer)
  styleElements.forEach(el => el.remove())
})
</script>

<template>
  <div class="render-preview">
    <div v-if="loading" class="render-status">Compiling...</div>
    <div v-else-if="error" class="render-error">
      <pre>{{ error }}</pre>
    </div>
    <div v-else-if="CompiledComponent" class="render-output">
      <component :is="CompiledComponent" />
    </div>
    <div v-else class="render-empty">No component to render</div>
  </div>
</template>

<style scoped>
.render-preview {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.render-status,
.render-empty {
  color: #888;
  font-size: 1rem;
}

.render-error {
  max-width: 600px;
  padding: 1rem;
  background: #fff0f0;
  border: 1px solid #ecc;
  border-radius: 8px;
  color: #c33;
}

.render-error pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.render-output {
  width: 100%;
}
</style>
