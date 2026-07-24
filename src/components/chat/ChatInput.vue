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
}>()

const text = ref('')

function handleSubmit() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('submit', trimmed)
  text.value = ''
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex gap-2">
    <input
      v-model="text"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
    />
    <button
      type="submit"
      :disabled="disabled || !text.trim()"
      class="rounded-lg bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
    >
      Send
    </button>
  </form>
</template>
