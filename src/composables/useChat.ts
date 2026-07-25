import { ref, onUnmounted, type Ref } from 'vue'

export interface StreamMessage {
  type: string
  content: string
  tool_calls?: Array<{
    id: string
    name: string
    args: Record<string, unknown>
    type: string
  }>
  tool_call_id?: string
  name?: string
  status?: string
  additional_kwargs?: Record<string, unknown>
  [key: string]: any
}

interface SSEEvent {
  id?: string
  event?: string
  data?: Record<string, unknown>
}

const API_URL = (window as any).__APP_CONFIG__?.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000'

function token() {
  return localStorage.getItem('token') || ''
}

function genId(): string {
  return crypto.randomUUID()
}

function sessionKey(cvId: number): string {
  return `chat_session_${cvId}`
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function parseSSE(buffer: string): { events: SSEEvent[]; rest: string } {
  const events: SSEEvent[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() || ''

  for (const block of parts) {
    if (!block.trim() || block.startsWith(':')) continue

    const msg: { id?: string; event?: string; data?: string } = {}
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) continue
      const ci = line.indexOf(':')
      if (ci === -1) continue
      const field = line.slice(0, ci)
      const raw = line.slice(ci + 1)
      const val = raw.startsWith(' ') ? raw.slice(1) : raw
      if (field === 'id') msg.id = val
      else if (field === 'event') msg.event = val
      else if (field === 'data') msg.data = (msg.data || '') + val
    }

    if (msg.data) {
      try { events.push({ ...msg, data: JSON.parse(msg.data) }) }
      catch { events.push(msg as any) }
    }
  }

  return { events, rest }
}

export function useChat(cvId: Ref<number>) {
  const messages = ref<StreamMessage[]>([])
  const isStreaming = ref(false)
  const threadId = ref<string | null>(null)
  const lastSeq = ref(0)
  let abort: AbortController | null = null
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  let shouldReconnect = false
  let streamActive = false
  const msgIndex = new Map<string, number>()

  function teardown() {
    reader?.cancel()
    abort?.abort()
    reader = null
    abort = null
  }

  function lastToolMsg(toolCallId: string): StreamMessage | undefined {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const m = messages.value[i]!
      if (m.type === 'tool' && m.tool_call_id === toolCallId) return m
    }
    return undefined
  }

  async function connect(): Promise<void> {
    const tid = threadId.value
    if (!tid) return

    abort = new AbortController()
    const signal = abort.signal

    const res = await fetch(`${API_URL}/threads/${tid}/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels: ['*'], since: lastSeq.value }),
      signal,
    })

    if (!res.ok) throw new Error(`Stream HTTP ${res.status}`)
    if (!res.body) throw new Error('No response body')

    reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const { events, rest } = parseSSE(buf)
      buf = rest

      for (const ev of events) {
        const seq = ev.data?.seq as number | undefined
        if (seq) lastSeq.value = seq

        const method = ev.data?.method as string | undefined
        const params = ev.data?.params as Record<string, any> | undefined
        if (!method || !params) continue

        const data = params.data as Record<string, any> | undefined
        if (!data) continue

        if (method === 'message_start') {
          const msg: StreamMessage = { type: 'ai', content: '' }
          messages.value.push(msg)
          msgIndex.set(data.id, messages.value.length - 1)
        } else if (method === 'values') {
          const msgs = params.data?.messages as StreamMessage[] | undefined
          if (msgs) messages.value = msgs
        } else if (method === 'text_delta') {
          const idx = msgIndex.get(data.id)
          if (idx === undefined) continue
          const msg = messages.value[idx]!
          if (data.kind === 'reasoning') {
            const ak = (msg.additional_kwargs ??= {}) as Record<string, unknown>
            ak.reasoning = ((ak.reasoning as string) || '') + data.delta
          } else {
            msg.content += data.delta
          }
        } else if (method === 'tool_calls_done') {
          const idx = msgIndex.get(data.id)
          if (idx !== undefined && data.tool_calls) {
            messages.value[idx]!.tool_calls = data.tool_calls
          }
        } else if (method === 'message_end') {
          msgIndex.delete(data.id)
        } else if (method === 'tool_start') {
          messages.value.push({
            type: 'tool',
            content: 'started\n',
            tool_call_id: data.tool_call_id,
            name: data.name,
            status: 'running',
          })
        } else if (method === 'tool_delta') {
          const tm = lastToolMsg(data.tool_call_id)
          if (tm) tm.content += data.delta
        } else if (method === 'tool_progress') {
          const tm = lastToolMsg(data.tool_call_id)
          if (tm) tm.content += (data.message || '') + '\n'
        } else if (method === 'tool_end') {
          const tm = lastToolMsg(data.tool_call_id)
          if (tm) {
            if (data.error) {
              tm.content += 'error: ' + data.error + '\n'
              tm.status = 'error'
            } else {
              tm.content += 'done\n'
              tm.status = 'success'
            }
          }
        } else if (method === 'lifecycle') {
          const evt = data.event as string | undefined
          if (evt === 'running') {
            isStreaming.value = true
          } else if (evt === 'completed' || evt === 'failed' || evt === 'cancelled') {
            isStreaming.value = false
          }
        }
      }
    }
  }

  async function initStream() {
    if (!threadId.value) return
    if (streamActive) return

    streamActive = true
    shouldReconnect = true

    while (shouldReconnect) {
      try {
        teardown()
        await connect()
        if (shouldReconnect) await delay(1000)
      } catch (err: any) {
        if (err.name === 'AbortError') {
          if (shouldReconnect) await delay(500)
          continue
        }
        console.error('stream error, reconnecting:', err)
        if (shouldReconnect) await delay(2000)
      }
    }

    streamActive = false
  }

  async function send(content: string) {
    if (!content.trim() || isStreaming.value) return

    let tid = threadId.value
    if (!tid) {
      tid = genId()
      threadId.value = tid
      localStorage.setItem(sessionKey(cvId.value), tid)
      initStream()
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
    }

    try {
      const fullMessages = [
        ...messages.value
          .filter((m) => m.type !== 'tool')
          .map((m) => ({ type: m.type, content: m.content })),
        { type: 'human' as const, content },
      ]

      messages.value.push({ type: 'human', content })

      const cmdRes = await fetch(`${API_URL}/threads/${tid}/commands`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          method: 'run.start',
          params: {
            input: { cv_id: cvId.value, messages: fullMessages },
          },
        }),
      })

      if (!cmdRes.ok) throw new Error(`Command HTTP ${cmdRes.status}`)
      const cmd = await cmdRes.json()
      if (cmd.type === 'error') throw new Error(cmd.message || 'Command failed')
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('send error:', err)
    }
  }

  async function stop() {
    shouldReconnect = false
    isStreaming.value = false
    reader?.cancel()
    abort?.abort()

    const tid = threadId.value
    if (tid) {
      try {
        await fetch(`${API_URL}/threads/${tid}/commands`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ method: 'run.cancel' }),
        })
      } catch {
        // ignore cancel errors
      }
    }
  }

  function clearChat() {
    shouldReconnect = false
    streamActive = false
    teardown()
    threadId.value = null
    localStorage.removeItem(sessionKey(cvId.value))
    messages.value = []
    lastSeq.value = 0
    msgIndex.clear()
  }

  async function loadHistory() {
    const stored = localStorage.getItem(sessionKey(cvId.value))
    if (stored) {
      threadId.value = stored
      lastSeq.value = 0
      initStream()
    }
  }

  onUnmounted(() => {
    shouldReconnect = false
    streamActive = false
    teardown()
  })

  return { messages, isStreaming, threadId, loadHistory, send, stop, clear: clearChat }
}
