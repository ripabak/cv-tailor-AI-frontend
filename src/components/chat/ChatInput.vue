<script setup lang="ts">
import { ref } from 'vue'

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
      class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 resize-none"
    />
    <button
      v-if="!disabled"
      type="submit"
      :disabled="!text.trim()"
      class="rounded-lg bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
    >
      Send
    </button>
    <button
      v-else
      type="button"
      @click="emit('stop')"
      class="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
    >
      Stop
    </button>
  </form>
</template>
