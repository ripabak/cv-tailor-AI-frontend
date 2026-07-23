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
  created_at: string
  updated_at: string
  latest_html?: string | null
  template_title?: string | null
}

export interface CVVersion {
  id: number
  user_cv_id: number
  html_content: string
  created_at: string
}

export interface CVGenerateResponse {
  cv: CV
  version: CVVersion
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}
