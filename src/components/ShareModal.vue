<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  visible: boolean
  url: string
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref(false)

function copyLink() {
  navigator.clipboard.writeText(props.url).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Share CV</h3>
        <div class="flex items-center gap-2">
          <input
            :value="url"
            readonly
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <button
            @click="copyLink"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'"
          >
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <div class="mt-4 flex justify-end">
          <button
            @click="emit('close')"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
