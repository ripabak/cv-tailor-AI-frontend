<script setup lang="ts">
import { ref } from 'vue'
import { useQueryCode } from './composables/useQueryCode'
import RenderPreview from './components/RenderPreview.vue'
import SourceCode from './components/SourceCode.vue'

const { code, loading, error } = useQueryCode()

const mode = ref<'preview' | 'source'>('preview')

function toggleMode() {
  mode.value = mode.value === 'preview' ? 'source' : 'preview'
}
</script>

<template>
  <div class="app-shell">
    <!-- Loading state -->
    <div v-if="loading" class="app-status">
      <span>Fetching code...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="app-status app-error">
      <span>{{ error }}</span>
    </div>

    <!-- Active: render or show source based on mode -->
    <template v-else-if="code">
      <RenderPreview v-if="mode === 'preview'" :code="code" />
      <SourceCode v-else :code="code" />
    </template>

    <!-- Empty state: no code provided -->
    <div v-else class="app-status app-empty">
      <div class="empty-state">
        <h2>Vue Component Visualizer</h2>
        <p>Pass a Vue SFC via URL query parameter to render it live.</p>
        <div class="usage">
          <code>?code=&lt;uri-encoded-vue-sfc&gt;</code>
          <span>or</span>
          <code>?url=&lt;url-to-fetch-sfc&gt;</code>
          <span>or</span>
          <code>?code=base64:&lt;base64-sfc&gt;</code>
        </div>
      </div>
    </div>

    <!-- Floating toggle button to switch between preview and source view -->
    <button
      v-if="code"
      class="mode-toggle"
      @click="toggleMode"
      :title="mode === 'preview' ? 'Show source code' : 'Show preview'"
    >
      <!-- Eye icon → currently in preview mode, click to see source -->
      <svg v-if="mode === 'preview'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      <!-- Code angle brackets → currently in source mode, click to see preview -->
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.app-shell {
  width: 100%;
  min-height: 100vh;
}

/* ----- Status states ----- */
.app-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #888;
  font-size: 1rem;
}

.app-error {
  color: #c33;
}

.app-empty {
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.usage {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
}

.usage code {
  background: #eee;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  color: #333;
}

.usage span {
  color: #999;
}

/* ----- Floating toggle button ----- */
.mode-toggle {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #333;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s, background 0.2s;
  z-index: 1000;
}

.mode-toggle:hover {
  background: #555;
  transform: scale(1.1);
}
</style>
