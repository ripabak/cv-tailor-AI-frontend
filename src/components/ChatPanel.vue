<script setup lang="ts">
import type { StreamMessage } from '@/composables/useChat'
import ChatContainer from './chat/ChatContainer.vue'
import AIBubble from './chat/AIBubble.vue'
import HumanBubble from './chat/HumanBubble.vue'
import ChatInput from './chat/ChatInput.vue'
import TypingIndicator from './chat/TypingIndicator.vue'
import ThinkingBubble from './ThinkingBubble.vue'
import Markdown from './Markdown.vue'
import { PhSpinner, PhCheck, PhX, PhCaretRight } from '@phosphor-icons/vue'

const props = defineProps<{
  messages: StreamMessage[]
  isStreaming: boolean
  totalUsage: { input_tokens?: number; output_tokens?: number; total_tokens?: number; calls?: number }
  disabled?: boolean
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

function statusIcon(status?: string) {
  if (status === 'running') return PhSpinner
  if (status === 'error') return PhX
  return PhCheck
}

function statusClasses(status?: string) {
  if (status === 'running') return 'border-primary text-primary bg-primary-light'
  if (status === 'error') return 'border-error text-error bg-error-bg'
  return 'border-success text-success bg-success-bg'
}
</script>

<template>
  <div class="flex flex-col h-full bg-surface">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-secondary shrink-0">
      <div class="flex items-center gap-3">
        <span class="text-[10px] font-mono tracking-widest text-text-secondary">[ AGENT_CONSOLE ]</span>
        <div
          v-if="totalUsage.total_tokens"
          class="text-[10px] font-mono tracking-widest text-text-tertiary tabular-nums"
          title="Total token usage for this chat"
        >
          TOKENS: {{ formatTokens(totalUsage.total_tokens) }}
        </div>
      </div>
      <button
        @click="emit('clear')"
        class="text-[10px] font-mono tracking-widest text-text-tertiary hover:text-error transition-colors"
      >
        [ CLEAR ]
      </button>
    </div>

    <!-- Chat -->
    <ChatContainer class="min-h-0 flex-1">
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="text-[10px] font-mono tracking-widest text-text-secondary border border-border px-3 py-1 mb-4">
          [ AWAITING INPUT ]
        </div>
        <p class="text-xs font-mono tracking-widest text-text-tertiary mb-4">SELECT PROMPT OR TYPE BELOW:</p>
        <div class="flex flex-wrap gap-2 justify-center max-w-md">
          <button
            v-for="preset in PRESETS"
            :key="preset"
            @click="handleSend(preset)"
            class="border border-border px-3 py-2 text-[10px] font-mono tracking-widest text-text-secondary text-left hover:border-primary hover:text-primary transition-colors"
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
            class="border px-3 py-2 text-[10px] font-mono tracking-widest inline-flex flex-col max-w-sm"
            :class="statusClasses(msg.status)"
          >
            <div
              class="flex items-center gap-1.5 font-bold cursor-pointer select-none"
              @click="msg._expanded = !msg._expanded"
            >
              <component
                :is="statusIcon(msg.status)"
                :class="['w-3.5 h-3.5 shrink-0', msg.status === 'running' ? 'animate-spin' : '']"
                weight="bold"
              />
              <span>{{ msg.name ?? 'TOOL' }}</span>
              <PhCaretRight
                class="w-3 h-3 shrink-0 ml-auto transition-transform"
                :class="{ 'rotate-90': msg._expanded !== false }"
                weight="bold"
              />
            </div>
            <div v-if="msg._expanded !== false" class="mt-1.5 leading-relaxed flex flex-col gap-0.5 text-[10px] tracking-widest text-text-secondary">
              <div v-for="(line, li) in msg.content.trim().split('\n').filter(Boolean)" :key="li">
                <div
                  class="flex items-start gap-1 cursor-pointer select-none"
                  @click="msg['_l' + li] = !msg['_l' + li]"
                >
                  <PhCaretRight
                    class="w-2.5 h-2.5 shrink-0 mt-0.5 transition-transform"
                    :class="{ 'rotate-90': msg['_l' + li] !== false }"
                    weight="bold"
                  />
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
          :disabled="isStreaming || props.disabled"
          @submit="handleSend"
          @stop="emit('stop')"
        />
      </template>
    </ChatContainer>
  </div>
</template>
