export interface User {
  id: number
  email: string
  display_name: string
  created_at: string
}

export interface Template {
  id: number
  title: string
  html_code: string
  is_published: boolean
  created_at: string
}

export interface CV {
  id: number
  user_id: number
  template_id: number
  title: string
  current_version_id?: number | null
  created_at: string
  updated_at: string
  latest_html?: string | null
  template_title?: string | null
}

export interface CVVersion {
  id: number
  user_cv_id: number
  html_content: string
  parent_version_id: number | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolCallDisplay {
  id: string
  name: string
  args: Record<string, unknown>
  status: 'pending' | 'running' | 'done' | 'error'
  output?: string
  error?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string | null
  reasoning?: string
  toolCalls?: ToolCallDisplay[]
  isStreaming?: boolean
  tool_calls?: ToolCall[]
  tool_call_id?: string
}
