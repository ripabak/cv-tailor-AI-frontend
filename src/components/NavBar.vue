<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { PhList, PhX } from '@phosphor-icons/vue'

const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()
const menuOpen = ref(false)

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <nav
    v-if="isAuthenticated"
    class="sticky top-0 z-50 h-14 border-b border-border bg-surface"
  >
    <div class="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <router-link
          to="/dashboard"
          class="font-sans text-sm font-black tracking-tighter text-text hover:text-primary transition-colors"
        >
          CV TAILOR<span class="text-text-tertiary">™</span>
        </router-link>

        <div class="hidden md:flex items-center gap-0 border-l border-border">
          <router-link
            to="/dashboard"
            class="px-4 py-2 text-xs font-mono tracking-widest text-text-secondary border-r border-border hover:bg-surface-secondary hover:text-text transition-colors"
            active-class="bg-surface-secondary text-text"
          >
            [ MY_CVS ]
          </router-link>
          <router-link
            to="/templates"
            class="px-4 py-2 text-xs font-mono tracking-widest text-text-secondary border-r border-border hover:bg-surface-secondary hover:text-text transition-colors"
            active-class="bg-surface-secondary text-text"
          >
            [ TEMPLATES ]
          </router-link>
          <router-link
            to="/memory"
            class="px-4 py-2 text-xs font-mono tracking-widest text-text-secondary border-r border-border hover:bg-surface-secondary hover:text-text transition-colors"
            active-class="bg-surface-secondary text-text"
          >
            [ MEMORY ]
          </router-link>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <span class="hidden md:block text-xs font-mono tracking-widest text-text-tertiary">
          {{ user?.display_name }}
        </span>
        <button
          @click="handleLogout"
          class="hidden md:block px-3 py-1.5 text-xs font-mono tracking-widest text-text-secondary border border-border hover:border-primary hover:text-primary transition-colors"
        >
          [ LOGOUT ]
        </button>
        <button
          @click="menuOpen = !menuOpen"
          class="md:hidden inline-flex items-center justify-center w-9 h-9 border border-border text-text-secondary hover:bg-surface-secondary transition-colors"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="menuOpen"
        >
          <PhList v-if="!menuOpen" class="w-5 h-5" weight="bold" />
          <PhX v-else class="w-5 h-5" weight="bold" />
        </button>
      </div>
    </div>
  </nav>

  <div
    v-if="menuOpen"
    class="md:hidden border-b border-border bg-surface-secondary px-4 sm:px-6 py-3"
  >
    <div class="flex flex-col border border-border">
      <router-link
        to="/dashboard"
        class="px-4 py-3 text-xs font-mono tracking-widest text-text-secondary border-b border-border hover:bg-surface hover:text-text"
        @click="menuOpen = false"
      >
        [ MY_CVS ]
      </router-link>
      <router-link
        to="/templates"
        class="px-4 py-3 text-xs font-mono tracking-widest text-text-secondary border-b border-border hover:bg-surface hover:text-text"
        @click="menuOpen = false"
      >
        [ TEMPLATES ]
      </router-link>
      <router-link
        to="/memory"
        class="px-4 py-3 text-xs font-mono tracking-widest text-text-secondary border-b border-border hover:bg-surface hover:text-text"
        @click="menuOpen = false"
      >
        [ MEMORY ]
      </router-link>
      <div class="px-4 py-3 text-xs font-mono tracking-widest text-text-tertiary border-b border-border">
        {{ user?.display_name }}
      </div>
      <button
        @click="handleLogout"
        class="px-4 py-3 text-left text-xs font-mono tracking-widest text-primary hover:bg-primary-light transition-colors"
      >
        [ LOGOUT ]
      </button>
    </div>
  </div>
</template>
