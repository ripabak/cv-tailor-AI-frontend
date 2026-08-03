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

const API_URL = import.meta.env.VITE_API_URL || (window as any).__APP_CONFIG__?.API_URL || 'http://localhost:8000'

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
  const totalUsage = ref<{ input_tokens?: number; output_tokens?: number; total_tokens?: number; calls?: number }>({})
  const lastRunId = ref<string | null>(null)
  const threadId = ref<string | null>(null)
  const lastSeq = ref(0)
  let abort: AbortController | null = null
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  let shouldReconnect = false
  let streamActive = false
  const msgIndex = new Map<string, number>()
  let streamEpoch = 0
  let persistTimer: ReturnType<typeof setTimeout> | null = null

  function persistNow() {
    const k = sessionKey(cvId.value)
    try {
      localStorage.setItem(k + '_messages', JSON.stringify(messages.value))
      localStorage.setItem(k + '_seq', String(lastSeq.value))
      localStorage.setItem(k + '_usage', JSON.stringify(totalUsage.value))
    } catch { /* quota exceeded */ }
  }

  function persist() {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(persistNow, 300)
  }

  function loadPersisted() {
    const k = sessionKey(cvId.value)
    const ms = localStorage.getItem(k + '_messages')
    if (ms) {
      try { messages.value = JSON.parse(ms) } catch {}
      lastSeq.value = Number.MAX_SAFE_INTEGER
    } else {
      const sq = localStorage.getItem(k + '_seq')
      if (sq) lastSeq.value = parseInt(sq, 10) || 0
    }
    const us = localStorage.getItem(k + '_usage')
    if (us) {
      try { totalUsage.value = JSON.parse(us) } catch {}
    }
  }

  function clearPersisted() {
    const k = sessionKey(cvId.value)
    localStorage.removeItem(k + '_messages')
    localStorage.removeItem(k + '_seq')
    localStorage.removeItem(k + '_usage')
  }

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
          persist()
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
        } else if (method === 'message_end') {
          msgIndex.delete(data.id)
          const u = data.usage as
            | { input_tokens?: number; output_tokens?: number; total_tokens?: number }
            | undefined
          if (u) {
            totalUsage.value = {
              input_tokens: (totalUsage.value.input_tokens || 0) + (u.input_tokens || 0),
              output_tokens: (totalUsage.value.output_tokens || 0) + (u.output_tokens || 0),
              total_tokens: (totalUsage.value.total_tokens || 0) + (u.total_tokens || 0),
              calls: (totalUsage.value.calls || 0) + 1,
            }
          }
          if (data.run_id) lastRunId.value = data.run_id
          persist()
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
            if (evt === 'completed' && data.run_id && data.run_id !== lastRunId.value) {
              const t = data.total_usage as
                | { input_tokens?: number; output_tokens?: number; total_tokens?: number; calls?: number }
                | undefined
              if (t) {
                totalUsage.value = {
                  input_tokens: (totalUsage.value.input_tokens || 0) + (t.input_tokens || 0),
                  output_tokens: (totalUsage.value.output_tokens || 0) + (t.output_tokens || 0),
                  total_tokens: (totalUsage.value.total_tokens || 0) + (t.total_tokens || 0),
                  calls: (totalUsage.value.calls || 0) + (t.calls || 0),
                }
                lastRunId.value = data.run_id
              }
            }
            persist()
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
    const epoch = ++streamEpoch

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

    if (epoch === streamEpoch) streamActive = false
  }

  async function send(content: string) {
    if (!content.trim() || isStreaming.value) return

    let tid = threadId.value
    if (!tid) {
      tid = genId()
      threadId.value = tid
      localStorage.setItem(sessionKey(cvId.value), tid)
    }
    initStream()

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
    }

    try {
      const fullMessages = [{ type: 'human' as const, content }]

      messages.value.push({ type: 'human', content })
      persistNow()

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
    streamActive = false
    msgIndex.clear()
    reader?.cancel()
    abort?.abort()

    const last = messages.value[messages.value.length - 1]
    if (last?.type === 'ai') messages.value.pop()
    persistNow()

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
    const tid = threadId.value
    shouldReconnect = false
    streamActive = false
    teardown()
    threadId.value = null
    localStorage.removeItem(sessionKey(cvId.value))
    clearPersisted()
    messages.value = []
    totalUsage.value = {}
    lastRunId.value = null
    lastSeq.value = 0
    msgIndex.clear()

    if (tid) {
      fetch(`${API_URL}/threads/${tid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      }).catch(() => {})
    }
  }

  async function loadHistory() {
    const stored = localStorage.getItem(sessionKey(cvId.value))
    if (stored) {
      threadId.value = stored
      loadPersisted()
      initStream()

      try {
        const res = await fetch(`${API_URL}/threads/${stored}`, {
          headers: { Authorization: `Bearer ${token()}` },
        })
        if (res.ok) {
          const data = await res.json()
          const serverMessages = (data?.messages || []) as StreamMessage[]
          if (serverMessages.length > 0) {
            messages.value = serverMessages
            persistNow()
          }
        }
      } catch {
        // keep localStorage cache on network error
      }
    }
  }

  onUnmounted(() => {
    shouldReconnect = false
    streamActive = false
    teardown()
    persistNow()
  })

  return { messages, isStreaming, totalUsage, threadId, loadHistory, send, stop, clear: clearChat }
}
