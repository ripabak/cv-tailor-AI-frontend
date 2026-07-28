<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const pages = computed(() => {
  const total = props.totalPages
  const current = props.page
  const delta = 2
  const range: (number | '...')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== '...') {
      range.push('...')
    }
  }
  return range
})

function goTo(p: number) {
  if (p >= 1 && p <= props.totalPages && p !== props.page) {
    emit('change', p)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
    <button
      :disabled="page <= 1"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      @click="goTo(page - 1)"
    >
      Prev
    </button>

    <template v-for="p in pages" :key="p">
      <span v-if="p === '...'" class="px-2 text-gray-400">...</span>
      <button
        v-else
        :class="[
          'px-3 py-1.5 text-sm rounded border transition-colors min-w-[36px]',
          p === page
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-300 hover:bg-gray-100',
        ]"
        @click="goTo(p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      :disabled="page >= totalPages"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      @click="goTo(page + 1)"
    >
      Next
    </button>
  </div>
</template>
