<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  messages: ChatMessage[]
}>()

const emit = defineEmits<{
  send: [prompt: string]
}>()

const prompt = ref('')
const chatRef = ref<HTMLDivElement>()

watch(() => props.messages.length, async () => {
  await nextTick()
  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight
  }
})

function handleSend() {
  const text = prompt.value.trim()
  if (!text) return
  emit('send', text)
  prompt.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Messages -->
    <div ref="chatRef" class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="messages.length === 0" class="text-center text-gray-400 mt-8">
        <p class="text-sm">Send a prompt to tailor your CV</p>
        <p class="text-xs mt-1">Example: "Change name to Budi, add 3 years experience as Frontend Developer at Tokopedia"</p>
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="[
          'max-w-[90%] rounded-lg px-3 py-2 text-sm',
          msg.role === 'user'
            ? 'bg-blue-600 text-white self-end ml-auto'
            : 'bg-gray-100 text-gray-800'
        ]"
      >
        {{ msg.content }}
      </div>
    </div>

    <!-- Input -->
    <div class="border-t border-gray-200 p-3">
      <div class="flex gap-2">
        <textarea
          v-model="prompt"
          @keydown.enter.exact.prevent="handleSend"
          placeholder="Describe what to change..."
          rows="2"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
        <button
          @click="handleSend"
          :disabled="!prompt.trim()"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors self-end"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>
