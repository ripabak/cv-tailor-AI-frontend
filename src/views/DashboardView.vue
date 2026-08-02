<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/composables/useApi'
import NavBar from '@/components/NavBar.vue'
import CVPreviewCard from '@/components/CVPreviewCard.vue'
import Pagination from '@/components/Pagination.vue'
import type { CV, PaginatedResponse } from '@/types'

const router = useRouter()
const cvs = ref<CV[]>([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

async function fetchCVs() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<PaginatedResponse<CV>>(`/cv?page=${page.value}&page_size=9`)
    cvs.value = res.items
    total.value = res.total
    totalPages.value = res.total_pages
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load CVs'
  } finally {
    loading.value = false
  }
}

async function deleteCV(id: number) {
  if (!confirm('DELETE CV UNIT?')) return
  try {
    await api.delete(`/cv/${id}`)
    cvs.value = cvs.value.filter(c => c.id !== id)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to delete'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function onPageChange(newPage: number) {
  page.value = newPage
  fetchCVs()
}

onMounted(fetchCVs)
</script>

<template>
  <NavBar />
  <div class="min-h-[calc(100dvh-3.5rem)] bg-surface">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-border pb-4">
        <div>
          <div class="text-[10px] font-mono tracking-widest text-text-tertiary mb-1">
            [ UNIT_REGISTRY ]
          </div>
          <h1 class="text-4xl md:text-5xl font-black leading-[0.85] tracking-[-0.03em] text-text">
            MY_CVS
          </h1>
          <p class="mt-2 text-xs font-mono tracking-widest text-text-secondary">
            TOTAL UNITS: {{ total }}
          </p>
        </div>
        <router-link
          to="/templates"
          class="px-4 py-3 text-xs font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover transition-colors text-center"
        >
          [ CREATE NEW CV ]
        </router-link>
      </div>

      <div v-if="loading" class="border border-border bg-surface-secondary p-6 text-xs font-mono tracking-widest text-text-secondary">
        [ LOADING UNITS... ]
      </div>

      <div v-else-if="error" class="border border-error bg-error-bg px-4 py-3 text-xs font-mono text-error">
        [ ERROR: {{ error }} ]
      </div>

      <div v-else-if="cvs.length === 0" class="border border-border bg-surface-secondary p-10">
        <div class="text-[10px] font-mono tracking-widest text-primary border border-primary inline-block px-2 py-0.5 mb-4">
          [ NO UNITS FOUND ]
        </div>
        <h2 class="text-2xl font-black text-text mb-2">NO CVs YET</h2>
        <p class="text-xs font-mono tracking-widest text-text-secondary mb-6 normal-case">
          Create your first CV unit to begin operations.
        </p>
        <router-link
          to="/templates"
          class="inline-block px-4 py-3 text-xs font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover transition-colors"
        >
          [ CREATE NEW CV ]
        </router-link>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-border">
          <CVPreviewCard
            v-for="cv in cvs"
            :key="cv.id"
            :title="cv.title"
            :html="cv.latest_html"
            :subtitle="`UPDATED ${formatDate(cv.updated_at)}`"
            @click="router.push(`/editor/${cv.id}`)"
          >
            <template #actions>
              <button
                @click.stop="deleteCV(cv.id)"
                class="px-2 py-1 text-[10px] font-mono tracking-widest text-text-secondary border border-border hover:border-error hover:text-error transition-colors"
                title="Delete CV"
              >
                [ DEL ]
              </button>
            </template>
          </CVPreviewCard>
        </div>

        <Pagination
          v-if="totalPages > 1"
          :page="page"
          :total-pages="totalPages"
          @change="onPageChange"
        />
      </template>
    </div>
  </div>
</template>
