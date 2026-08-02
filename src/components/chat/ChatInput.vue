<script setup lang="ts">
import { ref } from 'vue'
import { PhPaperPlaneRight, PhStop } from '@phosphor-icons/vue'

const props = withDefaults(defineProps<{
  disabled?: boolean
  placeholder?: string
}>(), {
  disabled: false,
  placeholder: 'Describe what to change...',
})

const emit = defineEmits<{
  submit: [text: string]
  stop: []
}>()

const text = ref('')

function handleSubmit() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('submit', trimmed)
  text.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex gap-2 items-end">
    <textarea
      v-model="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="1"
      @keydown="handleKeydown"
      class="flex-1 min-h-[44px] max-h-40 border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50 resize-none transition-colors normal-case"
    />
    <button
      v-if="!disabled"
      type="submit"
      :disabled="!text.trim()"
      class="inline-flex items-center justify-center w-10 h-11 border border-primary bg-primary text-primary-on hover:bg-primary-hover disabled:opacity-40 transition-colors"
      aria-label="Send"
    >
      <PhPaperPlaneRight class="w-4 h-4" weight="bold" />
    </button>
    <button
      v-else
      type="button"
      @click="emit('stop')"
      class="inline-flex items-center justify-center w-10 h-11 border border-error bg-error text-primary-on hover:bg-error-text transition-colors"
      aria-label="Stop"
    >
      <PhStop class="w-4 h-4" weight="bold" />
    </button>
  </form>
</template>
