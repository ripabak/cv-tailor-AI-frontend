import { ref, computed } from 'vue'
import type { User, TokenResponse } from '@/types'
import { api } from './useApi'

const token = ref<string | null>(localStorage.getItem('token'))
const user = ref<User | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  async function fetchUser() {
    if (!token.value) return
    try {
      user.value = await api.get<User>('/auth/me')
    } catch {
      logout()
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<TokenResponse>('/auth/login', { email, password })
    token.value = res.access_token
    localStorage.setItem('token', res.access_token)
    user.value = res.user
  }

  async function register(email: string, displayName: string, password: string) {
    const res = await api.post<TokenResponse>('/auth/register', {
      email,
      display_name: displayName,
      password,
    })
    token.value = res.access_token
    localStorage.setItem('token', res.access_token)
    user.value = res.user
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  if (token.value) {
    fetchUser()
  }

  return { token, user, isAuthenticated, login, register, logout, fetchUser }
}
