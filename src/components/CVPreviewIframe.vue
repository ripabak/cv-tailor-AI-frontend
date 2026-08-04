<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  html: string
  editable?: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let editStyleEl: HTMLStyleElement | null = null

function setEditable() {
  const doc = iframeRef.value?.contentDocument
  if (!doc?.body) return
  doc.body.contentEditable = props.editable ? 'true' : 'false'
  if (props.editable) {
    if (!editStyleEl || !editStyleEl.isConnected) {
      editStyleEl = doc.createElement('style')
      editStyleEl.textContent =
        'body::after { content: ""; position: fixed; inset: 0; z-index: 99999; pointer-events: none; ' +
        'background-image: linear-gradient(rgba(230,25,25,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(230,25,25,.07) 1px, transparent 1px); ' +
        'background-size: 20px 20px; background-position: -1px -1px; }' +
        '[contenteditable="true"] { outline: 1px dashed rgba(230,25,25,.35); outline-offset: 3px; }' +
        '[contenteditable="true"]:hover { outline: 1px dashed rgba(230,25,25,.85); outline-offset: 2px; }' +
        '[contenteditable="true"]:focus { outline: 1px solid rgba(230,25,25,1); outline-offset: 2px; }'
      doc.head.appendChild(editStyleEl)
    }
  } else if (editStyleEl?.isConnected) {
    editStyleEl.remove()
    editStyleEl = null
  }
}

function onDocKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    emit('save')
  }
}

function onIframeLoad() {
  setEditable()
  const doc = iframeRef.value?.contentDocument
  if (doc) {
    doc.removeEventListener('keydown', onDocKeydown)
    if (props.editable) doc.addEventListener('keydown', onDocKeydown)
  }
}

watch(() => props.editable, (val) => {
  const doc = iframeRef.value?.contentDocument
  if (!doc) return
  setEditable()
  doc.removeEventListener('keydown', onDocKeydown)
  if (val) doc.addEventListener('keydown', onDocKeydown)
})

function getHTML() {
  if (editStyleEl?.isConnected) {
    editStyleEl.remove()
    editStyleEl = null
  }
  const doc = iframeRef.value?.contentDocument
  if (!doc?.documentElement) return props.html
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
}

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

defineExpose({ print, saveScroll, restoreScroll, getHTML, iframeRef })
</script>

<template>
  <div
    class="w-full h-full bg-surface border flex flex-col"
    :class="editable ? 'border-primary cv-edit-pulse' : 'border-border'"
  >
    <div
      v-if="editable"
      class="flex items-center gap-2 px-3 py-1.5 border-b border-primary bg-primary-light text-[10px] font-mono tracking-widest text-primary shrink-0"
    >
      <span class="cv-blink inline-block w-2 h-2 bg-primary" />
      [ REC ] EDIT MODE — CLICK CONTENT TO EDIT
      <span class="hidden sm:inline text-text-tertiary">· CMD/CTRL+S TO SAVE</span>
    </div>
    <iframe
      v-if="html"
      ref="iframeRef"
      :srcdoc="html"
      sandbox="allow-scripts allow-same-origin allow-modals"
      class="block border-0 w-full min-h-0 flex-1"
      :class="editable ? 'cursor-text' : 'cursor-default'"
      title="CV Preview"
      @load="onIframeLoad"
    />
    <div
      v-else
      class="flex items-center justify-center h-full p-4 text-[10px] font-mono tracking-widest text-text-tertiary"
    >
      [ CV PREVIEW WILL APPEAR HERE ]
    </div>
  </div>
</template>
