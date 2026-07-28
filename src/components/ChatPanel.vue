<script setup lang="ts">
import type { StreamMessage } from '@/composables/useChat'
import ChatContainer from './chat/ChatContainer.vue'
import AIBubble from './chat/AIBubble.vue'
import HumanBubble from './chat/HumanBubble.vue'
import ChatInput from './chat/ChatInput.vue'
import TypingIndicator from './chat/TypingIndicator.vue'
import ThinkingBubble from './ThinkingBubble.vue'
import Markdown from './Markdown.vue'

const props = defineProps<{
  messages: StreamMessage[]
  isStreaming: boolean
  totalUsage: { input_tokens?: number; output_tokens?: number; total_tokens?: number; calls?: number }
}>()

const emit = defineEmits<{
  send: [prompt: string]
  clear: []
  stop: []
}>()

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

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
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-text-secondary">Chat</span>
        <div
          v-if="totalUsage.total_tokens"
          class="flex items-center gap-1 text-[10px] text-text-tertiary"
          title="Total token usage for this chat"
        >
          <span class="tabular-nums">{{ formatTokens(totalUsage.total_tokens) }} tokens</span>
        </div>
      </div>
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
          <AIBubble v-if="msg.content">
            <Markdown :content="msg.content" />
          </AIBubble>
        </template>

        <div v-else-if="msg.type === 'tool'" class="flex justify-center">
          <div
            class="rounded-lg border px-3 py-2 text-xs font-mono inline-flex flex-col max-w-sm"
            :class="{
              'border-primary/20 bg-primary-light text-primary': msg.status === 'running',
              'border-emerald-200 bg-emerald-50 text-emerald-700': msg.status !== 'running' && msg.status !== 'error',
              'border-red-200 bg-red-50 text-error': msg.status === 'error',
            }"
          >
            <div
              class="flex items-center gap-1.5 font-semibold text-xs cursor-pointer select-none"
              @click="msg._expanded = !msg._expanded"
            >
              <svg v-if="msg.status === 'running'" class="w-3 h-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <svg v-else-if="msg.status !== 'error'" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{{ msg.name ?? 'tool' }}</span>
              <svg class="w-3 h-3 shrink-0 ml-auto transition-transform" :class="{ 'rotate-180': msg._expanded !== false }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div v-if="msg._expanded !== false" class="mt-1.5 text-[11px] leading-relaxed opacity-80 flex flex-col gap-0.5">
              <div v-for="(line, li) in msg.content.trim().split('\n').filter(Boolean)" :key="li">
                <div
                  class="flex items-start gap-1 cursor-pointer select-none"
                  @click="msg['_l' + li] = !msg['_l' + li]"
                >
                  <svg class="w-2.5 h-2.5 shrink-0 mt-0.5 transition-transform" :class="{ 'rotate-90': msg['_l' + li] !== false }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span class="whitespace-pre-wrap break-all">{{ line.length > 80 && msg['_l' + li] === false ? line.slice(0, 80) + '…' : line }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <TypingIndicator v-if="isStreaming" />

      <template #input>
        <ChatInput
          :disabled="isStreaming"
          @submit="handleSend"
          @stop="emit('stop')"
        />
      </template>
    </ChatContainer>
  </div>
</template>
