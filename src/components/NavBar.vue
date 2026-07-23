<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <nav v-if="isAuthenticated" class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-6">
      <router-link to="/dashboard" class="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors">
        CV Tailor
      </router-link>
      <div class="flex gap-4">
        <router-link to="/dashboard" class="text-sm text-gray-600 hover:text-gray-900">My CVs</router-link>
        <router-link to="/templates" class="text-sm text-gray-600 hover:text-gray-900">Templates</router-link>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-500">{{ user?.display_name }}</span>
      <button @click="handleLogout" class="text-sm text-gray-500 hover:text-red-600 transition-colors">
        Logout
      </button>
    </div>
  </nav>
</template>
