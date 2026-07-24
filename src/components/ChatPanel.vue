<script setup lang="ts">
import type { StreamMessage } from '@/composables/useChat'
import ChatContainer from './chat/ChatContainer.vue'
import AIBubble from './chat/AIBubble.vue'
import HumanBubble from './chat/HumanBubble.vue'
import ChatInput from './chat/ChatInput.vue'
import TypingIndicator from './chat/TypingIndicator.vue'
import ThinkingBubble from './ThinkingBubble.vue'
import ToolCallBubble from './ToolCallBubble.vue'
import Markdown from './Markdown.vue'

const props = defineProps<{
  messages: StreamMessage[]
  isStreaming: boolean
}>()

const emit = defineEmits<{
  send: [prompt: string]
  clear: []
}>()

const PRESETS = [
  'Complete my CV with professional experience and skills',
  'Add a professional summary at the top',
  'Improve the formatting and layout',
  'Change the name to Budi Santoso',
]

function handleSend(text: string) {
  emit('send', text)
}
</script>

<template>
  <div class="flex flex-col h-full bg-surface">
    <!-- Header (fixed) -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-secondary shrink-0">
      <span class="text-xs font-medium text-text-secondary">Chat</span>
      <button
        @click="emit('clear')"
        class="text-xs text-text-tertiary hover:text-error transition-colors cursor-pointer"
      >
        Clear chat
      </button>
    </div>

    <!-- Chat (scrollable + input) -->
    <ChatContainer class="min-h-0 flex-1">
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p class="text-sm text-text-tertiary font-medium">Start chatting to tailor your CV</p>
        <p class="text-xs text-text-tertiary mt-1 mb-4">Or try one of these prompts:</p>
        <div class="flex flex-wrap gap-2 justify-center max-w-md">
          <button
            v-for="preset in PRESETS"
            :key="preset"
            @click="handleSend(preset)"
            class="rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer text-left leading-relaxed"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <template v-for="(msg, i) in messages" :key="i">
        <HumanBubble v-if="msg.type === 'human'">
          {{ msg.content }}
        </HumanBubble>

        <template v-else-if="msg.type === 'ai'">
          <ThinkingBubble
            v-if="msg.additional_kwargs?.reasoning"
            :content="String(msg.additional_kwargs.reasoning)"
            :is-streaming="isStreaming && i === messages.length - 1"
          />
          <ToolCallBubble
            v-for="tc in msg.tool_calls"
            :key="tc.id"
            :name="tc.name"
            :status="i === messages.length - 1 && isStreaming ? 'running' : 'done'"
          />
          <AIBubble v-if="msg.content">
            <Markdown :content="msg.content" />
          </AIBubble>
        </template>

        <div v-else-if="msg.type === 'tool'" class="flex justify-center">
          <div
            class="rounded-lg border px-2.5 py-1 text-xs font-mono"
            :class="msg.status === 'error'
              ? 'border-red-200 bg-red-50 text-error'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
          >
            {{ msg.name ?? 'tool' }} {{ msg.status === 'error' ? 'failed' : 'done' }}
          </div>
        </div>
      </template>

      <TypingIndicator v-if="isStreaming" />

      <template #input>
        <ChatInput
          :disabled="isStreaming"
          @submit="handleSend"
        />
      </template>
    </ChatContainer>
  </div>
</template>
