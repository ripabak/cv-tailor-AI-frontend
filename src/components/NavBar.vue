<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()
const menuOpen = ref(false)

function handleLogout() {
  logout()
  router.push('/login')
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <nav v-if="isAuthenticated" class="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-6">
      <router-link
        to="/dashboard"
        class="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors"
        @click="closeMenu"
      >
        CV Tailor
      </router-link>
      <div class="hidden md:flex gap-4">
        <router-link to="/dashboard" class="text-sm text-gray-600 hover:text-gray-900">My CVs</router-link>
        <router-link to="/templates" class="text-sm text-gray-600 hover:text-gray-900">Templates</router-link>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <span class="hidden md:inline text-sm text-gray-500">{{ user?.display_name }}</span>
      <button
        @click="handleLogout"
        class="hidden md:inline text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
      >
        Logout
      </button>
      <button
        @click="menuOpen = !menuOpen"
        class="md:hidden p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Toggle menu"
      >
        <svg v-if="!menuOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>
  <div
    v-if="menuOpen"
    class="md:hidden bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col gap-3 shadow-sm"
  >
    <router-link to="/dashboard" class="text-sm text-gray-600 hover:text-gray-900 py-1" @click="closeMenu">My CVs</router-link>
    <router-link to="/templates" class="text-sm text-gray-600 hover:text-gray-900 py-1" @click="closeMenu">Templates</router-link>
    <hr class="border-gray-200" />
    <span class="text-sm text-gray-500 py-1">{{ user?.display_name }}</span>
    <button
      @click="handleLogout"
      class="text-sm text-gray-500 hover:text-red-600 transition-colors text-left py-1 cursor-pointer"
    >
      Logout
    </button>
  </div>
</template>
