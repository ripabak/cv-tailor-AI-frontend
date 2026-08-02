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
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-0 mt-8 border border-border w-fit mx-auto">
    <button
      :disabled="page <= 1"
      class="px-3 py-2 text-[10px] font-mono tracking-widest text-text-secondary border-r border-border hover:bg-surface-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      @click="goTo(page - 1)"
      aria-label="Previous page"
    >
      <<< PREV
    </button>

    <template v-for="p in pages" :key="p">
      <span v-if="p === '...'" class="px-3 py-2 text-[10px] font-mono tracking-widest text-text-tertiary border-r border-border">...</span>
      <button
        v-else
        :class="[
          'min-w-[40px] px-3 py-2 text-[10px] font-mono tracking-widest border-r border-border transition-colors',
          p === page
            ? 'bg-primary text-primary-on'
            : 'text-text-secondary hover:bg-surface-secondary hover:text-text',
        ]"
        @click="goTo(p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      :disabled="page >= totalPages"
      class="px-3 py-2 text-[10px] font-mono tracking-widest text-text-secondary hover:bg-surface-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      @click="goTo(page + 1)"
      aria-label="Next page"
    >
      NEXT >>>
    </button>
  </div>
</template>
