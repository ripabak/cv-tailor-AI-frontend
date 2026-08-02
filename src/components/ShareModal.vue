<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  visible: boolean
  url: string
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref(false)

function copyLink() {
  navigator.clipboard.writeText(props.url).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-surface p-4"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md border border-border bg-surface-secondary p-1">
        <div class="border border-border p-6">
          <div class="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 class="text-[10px] font-mono tracking-widest text-primary border border-primary px-2 py-0.5">
              [ SHARE CV ]
            </h3>
            <button
              @click="emit('close')"
              class="px-2 py-1 text-[10px] font-mono tracking-widest text-text-secondary border border-border hover:text-primary transition-colors"
              aria-label="Close"
            >
              [ X ]
            </button>
          </div>

          <div class="flex items-center gap-2">
            <input
              :value="url"
              readonly
              class="flex-1 border border-border bg-surface px-3 py-2.5 text-xs font-mono tracking-widest text-text focus:outline-none"
              @focus="($event.target as HTMLInputElement).select()"
            />
            <button
              @click="copyLink"
              class="px-3 py-2.5 text-[10px] font-mono tracking-widest transition-colors"
              :class="copied ? 'bg-success-bg text-success border border-success' : 'bg-primary text-primary-on border border-primary hover:bg-primary-hover'"
            >
              {{ copied ? '[ COPIED ]' : '[ COPY ]' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
