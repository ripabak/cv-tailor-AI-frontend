<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] flex items-center justify-center bg-surface p-4">
    <div class="w-full max-w-md border border-border bg-surface-secondary p-1">
      <div class="border border-border p-8">
        <div class="mb-8">
          <router-link to="/" class="font-sans text-sm font-black tracking-tighter text-text hover:text-primary transition-colors">
            CV TAILOR<span class="text-text-tertiary">™</span>
          </router-link>
          <div class="text-[10px] font-mono tracking-widest text-primary border border-primary inline-block px-2 py-0.5 mt-4">
            [ AUTHENTICATE ]
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
          <div>
            <label for="email" class="block text-[10px] font-mono tracking-widest text-text-tertiary mb-2">
              [ EMAIL ]
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors normal-case"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-[10px] font-mono tracking-widest text-text-tertiary mb-2">
              [ PASSWORD ]
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors normal-case"
              placeholder="••••••••"
            />
          </div>

          <div
            v-if="error"
            class="border border-error bg-error-bg px-3 py-2 text-xs font-mono text-error"
          >
            [ ERROR: {{ error }} ]
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full px-4 py-3 text-xs font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {{ loading ? 'AUTHENTICATING...' : 'SIGN IN >>>' }}
          </button>
        </form>

        <p class="mt-6 text-[10px] font-mono tracking-widest text-text-tertiary normal-case">
          NO ACCOUNT?
          <router-link to="/register" class="text-primary hover:text-primary-hover hover:underline">CREATE ONE</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
