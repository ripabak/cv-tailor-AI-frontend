<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  messages: ChatMessage[]
  isStreaming: boolean
}>()

const emit = defineEmits<{
  send: [prompt: string]
  clear: []
}>()

const prompt = ref('')
const chatRef = ref<HTMLDivElement>()

watch(() => props.messages.length, async () => {
  await nextTick()
  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight
  }
})

watch(() => props.messages, async () => {
  await nextTick()
  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight
  }
}, { deep: true })

function handleSend() {
  const text = prompt.value.trim()
  if (!text) return
  emit('send', text)
  prompt.value = ''
}

function getBubbleClass(role: string): string {
  if (role === 'user') return 'bg-blue-600 text-white self-end ml-auto'
  if (role === 'tool') return 'bg-purple-50 text-purple-800 border border-purple-200'
  return 'bg-gray-100 text-gray-800'
}

function isToolMessage(content: string | null): boolean {
  if (!content) return false
  return (
    content.startsWith('🔧') || content.startsWith('✅') ||
    content.startsWith('📖') || content.startsWith('✏️') ||
    content.startsWith('⚠️')
  )
}

function formatContent(msg: ChatMessage): string {
  if (msg.role === 'tool') return `Answer: ${msg.content || ''}`
  return msg.content || ''
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
      <span class="text-xs font-medium text-gray-500">Chat</span>
      <button
        @click="$emit('clear')"
        class="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        Clear chat
      </button>
    </div>

    <!-- Messages -->
    <div ref="chatRef" class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="messages.length === 0" class="text-center text-gray-400 mt-8">
        <p class="text-sm">Start chatting to tailor your CV</p>
        <p class="text-xs mt-1">Example: "Change name to Budi, add 3 years experience as Software Engineer at Tokopedia"</p>
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="[
          'max-w-[90%] rounded-lg px-3 py-2 text-sm',
          getBubbleClass(msg.role),
          isToolMessage(msg.content) ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : '',
        ]"
      >
        <span v-if="isToolMessage(msg.content)" class="font-mono text-xs">{{ formatContent(msg) }}</span>
        <span v-else>{{ formatContent(msg) }}</span>
      </div>

      <!-- Streaming indicator -->
      <div v-if="isStreaming" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
        <span class="flex gap-1">
          <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></span>
          <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
          <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
        </span>
        <span>Agent is working...</span>
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
          :disabled="!prompt.trim() || isStreaming"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors self-end"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>
