<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/composables/useApi'
import NavBar from '@/components/NavBar.vue'
import CVPreviewCard from '@/components/CVPreviewCard.vue'
import Pagination from '@/components/Pagination.vue'
import type { Template, PaginatedResponse } from '@/types'

const router = useRouter()
const templates = ref<Template[]>([])
const loading = ref(true)
const error = ref('')
const generating = ref<number | null>(null)
const page = ref(1)
const totalPages = ref(1)

async function fetchTemplates() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<PaginatedResponse<Template>>(`/templates?page=${page.value}&page_size=9`)
    templates.value = res.items
    totalPages.value = res.total_pages
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load templates'
  } finally {
    loading.value = false
  }
}

async function createCV(templateId: number) {
  generating.value = templateId
  try {
    const res = await api.post<{ id: number; latest_html: string }>('/cv', {
      template_id: templateId,
    })
    router.push(`/editor/${res.id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create CV'
  } finally {
    generating.value = null
  }
}

function onPageChange(newPage: number) {
  page.value = newPage
  fetchTemplates()
}

onMounted(fetchTemplates)
</script>

<template>
  <NavBar />
  <div class="min-h-[calc(100dvh-3.5rem)] bg-surface">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div class="mb-8 border-b border-border pb-4">
        <div class="text-[10px] font-mono tracking-widest text-text-tertiary mb-1">
          [ TEMPLATE_BANK ]
        </div>
        <h1 class="text-4xl md:text-5xl font-black leading-[0.85] tracking-[-0.03em] text-text">
          CHOOSE_TEMPLATE
        </h1>
        <p class="mt-2 text-xs font-mono tracking-widest text-text-secondary">
          SELECT A STARTING CHASSIS.
        </p>
      </div>

      <div v-if="loading" class="border border-border bg-surface-secondary p-6 text-xs font-mono tracking-widest text-text-secondary">
        [ LOADING TEMPLATES... ]
      </div>

      <div v-else-if="error" class="border border-error bg-error-bg px-4 py-3 text-xs font-mono text-error">
        [ ERROR: {{ error }} ]
      </div>

      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-border">
          <CVPreviewCard
            v-for="tpl in templates"
            :key="tpl.id"
            :title="tpl.title"
            :html="tpl.html_code"
            subtitle="A4 FORMAT"
            @click="createCV(tpl.id)"
          >
            <template #actions>
              <button
                @click.stop="createCV(tpl.id)"
                :disabled="generating === tpl.id"
                class="px-3 py-1.5 text-[10px] font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ generating === tpl.id ? 'ASSEMBLING...' : '[ USE THIS ]' }}
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
