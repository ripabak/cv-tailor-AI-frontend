import { ref, type Ref } from 'vue'
import type { ChatMessage } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

function sessionKey(cvId: number): string {
  return `chat_session_${cvId}`
}

export function useChat(cvId: Ref<number>) {
  const messages = ref<ChatMessage[]>([])
  const isStreaming = ref(false)
  const sessionId = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)

  function addMessage(msg: ChatMessage) {
    messages.value.push(msg)
  }

  function updateLastAssistant(content: string) {
    const msgs = messages.value
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null
    if (last && last.role === 'assistant') {
      last.content = (last.content || '') + content
    } else {
      msgs.push({ role: 'assistant' as const, content })
    }
  }

  function handleDeltaContent(content: string) {
    if (content.startsWith('\n📖') || content.startsWith('\n✏️') || content.startsWith('\n✅') || content.startsWith('\n⚠️') || content.startsWith('\n🔧')) {
      addMessage({ role: 'assistant' as const, content: content.trim() })
    } else {
      updateLastAssistant(content)
    }
  }

  async function loadHistory() {
    const token = getToken()
    try {
      const res = await fetch(`${BASE_URL}/cv/${cvId.value}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data: { role: string; content: string | null; tool_calls?: never; tool_call_id?: string; created_at: string }[] = await res.json()
      if (data.length === 0) return

      messages.value = data.map((m) => ({
        role: m.role as ChatMessage['role'],
        content: m.content ?? null,
        tool_calls: m.tool_calls as never,
        tool_call_id: m.tool_call_id,
      }))

      const stored = localStorage.getItem(sessionKey(cvId.value))
      if (stored) {
        sessionId.value = stored
      }
    } catch {
      // silent
    }
  }

  async function send(userContent: string) {
    if (!userContent.trim() || isStreaming.value) return

    addMessage({ role: 'user', content: userContent })
    isStreaming.value = true

    const controller = new AbortController()
    abortController.value = controller

    const token = getToken()
    const payload = {
      messages: messages.value.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      })),
      session_id: sessionId.value,
      stream: true,
    }

    try {
      const response = await fetch(`${BASE_URL}/cv/${cvId.value}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(err.detail || `HTTP ${response.status}`)
      }

      const newSessionId = response.headers.get('X-Session-Id')
      if (newSessionId) {
        sessionId.value = newSessionId
        localStorage.setItem(sessionKey(cvId.value), newSessionId)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue
          if (line === 'data: [DONE]') {
            isStreaming.value = false
            return
          }
          if (!line.startsWith('data: ')) continue

          try {
            const parsed = JSON.parse(line.slice(6))
            const choices = parsed.choices
            if (!choices || choices.length === 0) continue

            const delta = choices[0].delta || {}
            const finishReason = choices[0].finish_reason

            if (delta.content) {
              handleDeltaContent(delta.content as string)
            }

            if (finishReason === 'stop') {
              isStreaming.value = false
            }
          } catch {
            continue
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      const msg = e instanceof Error ? e.message : 'Stream failed'
      addMessage({ role: 'assistant', content: `Error: ${msg}` })
    } finally {
      isStreaming.value = false
    }
  }

  function stop() {
    abortController.value?.abort()
    isStreaming.value = false
  }

  async function clear() {
    messages.value = []
    sessionId.value = null
    localStorage.removeItem(sessionKey(cvId.value))

    const token = getToken()
    try {
      await fetch(`${BASE_URL}/cv/${cvId.value}/chat`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // silent
    }
  }

  return {
    messages,
    isStreaming,
    sessionId,
    loadHistory,
    send,
    stop,
    clear,
  }
}
