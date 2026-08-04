<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/composables/useApi'
import NavBar from '@/components/NavBar.vue'
import { PhPlus, PhTrash, PhPencilSimple } from '@phosphor-icons/vue'
import type { MemoryFact, MemoryList } from '@/types'

const SUGGESTED_CATEGORIES = ['kontak', 'pengalaman', 'pendidikan', 'skill', 'bahasa', 'target', 'preferensi']

const facts = ref<MemoryFact[]>([])
const loading = ref(true)
const error = ref('')
const usedCategories = ref<string[]>([...SUGGESTED_CATEGORIES])

const newCategory = ref<string>('')
const newContent = ref('')
const saving = ref(false)
const formError = ref('')

const editingKey = ref<string | null>(null)
const editingContent = ref('')

interface FactGroup {
  category: string
  facts: MemoryFact[]
}

async function fetchCategories() {
  try {
    const res = await api.get<string[]>('/memory/categories')
    const merged = new Set(SUGGESTED_CATEGORIES)
    for (const cat of res) merged.add(cat)
    usedCategories.value = [...merged].sort()
  } catch {
    const merged = new Set(SUGGESTED_CATEGORIES)
    for (const fact of facts.value) {
      if (fact.category.trim()) merged.add(fact.category.trim())
    }
    usedCategories.value = [...merged].sort()
  }
}

const groupedFacts = computed<FactGroup[]>(() => {
  const groups = new Map<string, MemoryFact[]>()
  for (const fact of facts.value) {
    const cat = fact.category.trim() || 'lainnya'
    const list = groups.get(cat) ?? []
    list.push(fact)
    groups.set(cat, list)
  }
  return [...groups.entries()]
    .map(([category, facts]) => ({ category, facts }))
    .sort((a, b) => a.category.localeCompare(b.category))
})

async function fetchMemory() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<MemoryList>('/memory')
    facts.value = res.facts
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load memory'
  } finally {
    loading.value = false
  }
}

async function addFact() {
  formError.value = ''
  if (!newCategory.value.trim()) {
    formError.value = 'CATEGORY REQUIRED'
    return
  }
  if (!newContent.value.trim()) {
    formError.value = 'CONTENT REQUIRED'
    return
  }
  saving.value = true
  try {
    await api.post<MemoryFact>('/memory', {
      category: newCategory.value.trim(),
      content: newContent.value.trim(),
    })
    newCategory.value = ''
    newContent.value = ''
    await fetchMemory()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'Failed to save fact'
  } finally {
    saving.value = false
  }
}

function startEdit(fact: MemoryFact) {
  editingKey.value = fact.key
  editingContent.value = fact.content
}

function cancelEdit() {
  editingKey.value = null
  editingContent.value = ''
}

async function saveEdit(key: string) {
  try {
    await api.patch<MemoryFact>(`/memory/${key}`, {
      content: editingContent.value.trim(),
    })
    editingKey.value = null
    editingContent.value = ''
    await fetchMemory()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to update fact'
  }
}

async function deleteFact(key: string) {
  if (!confirm('DELETE MEMORY FACT?')) return
  try {
    await api.delete(`/memory/${key}`)
    await fetchMemory()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to delete fact'
  }
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  fetchCategories()
  fetchMemory()
})
</script>

<template>
  <NavBar />
  <div class="min-h-[calc(100dvh-3.5rem)] bg-surface">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-border pb-4">
        <div>
          <div class="text-[10px] font-mono tracking-widest text-text-tertiary mb-1">
            [ USER_MEMORY_ARCHIVE ]
          </div>
          <h1 class="text-4xl md:text-5xl font-black leading-[0.85] tracking-[-0.03em] text-text">
            MEMORY
          </h1>
          <p class="mt-2 text-xs font-mono tracking-widest text-text-secondary">
            FACTS: {{ facts.length }} STORED
          </p>
        </div>
      </div>

      <div v-if="error" class="border border-error bg-error-bg px-4 py-3 text-xs font-mono text-error mb-6">
        [ ERROR: {{ error }} ]
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="border border-border bg-surface-secondary p-4 md:p-6">
          <div class="text-[10px] font-mono tracking-widest text-primary border border-primary inline-block px-2 py-0.5 mb-4">
            [ ADD FACT ]
          </div>
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <input
                v-model="newCategory"
                list="category-suggestions"
                placeholder="CATEGORY (bebas)..."
                class="bg-surface border border-border px-3 py-2.5 text-xs font-mono tracking-widest text-text placeholder:text-text-tertiary focus:border-primary focus:outline-none"
              />
              <datalist id="category-suggestions">
                <option v-for="cat in usedCategories" :key="cat" :value="cat">{{ cat }}</option>
              </datalist>
              <span class="text-[10px] font-mono tracking-widest text-text-tertiary">
                SUGGESTED: {{ usedCategories.join(', ') }}
              </span>
            </div>
            <textarea
              v-model="newContent"
              rows="3"
              placeholder="FACT CONTENT..."
              class="bg-surface border border-border px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:border-primary focus:outline-none resize-none"
            ></textarea>
            <button
              :disabled="saving"
              class="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
              @click="addFact"
            >
              <PhPlus class="w-4 h-4" weight="bold" />
              [ SAVE FACT ]
            </button>
            <div v-if="formError" class="text-xs font-mono tracking-widest text-error">
              [ {{ formError }} ]
            </div>
          </div>
        </div>

        <div class="border border-border bg-surface-secondary p-4 md:p-6">
          <div class="text-[10px] font-mono tracking-widest text-success border border-success inline-block px-2 py-0.5 mb-4">
            [ HOW IT WORKS ]
          </div>
          <div class="text-xs font-mono tracking-widest text-text-secondary leading-5">
            <p>Fakta disimpan otomatis oleh agent saat kamu berbagi info personal di chat.</p>
            <p class="mt-2">Berlaku untuk semua CV — kontak, pengalaman, skill, target role, preferensi.</p>
            <p class="mt-2 text-text-tertiary">Edit atau hapus manual di sini — koreksi kamu berlaku (last-write-wins).</p>
          </div>
        </div>
      </div>

      <div class="mt-8 border-b border-border pb-4">
        <div class="text-[10px] font-mono tracking-widest text-text-tertiary mb-1">
          [ FACTS ]
        </div>
        <h2 class="text-2xl font-black tracking-[-0.02em] text-text">STORED MEMORY</h2>
      </div>

      <div v-if="loading" class="border border-border bg-surface-secondary p-6 text-xs font-mono tracking-widest text-text-secondary mt-4">
        [ LOADING MEMORY... ]
      </div>

      <template v-else>
        <div v-if="groupedFacts.length === 0" class="border border-border bg-surface-secondary p-10 mt-4">
          <div class="text-[10px] font-mono tracking-widest text-primary border border-primary inline-block px-2 py-0.5 mb-4">
            [ NO FACTS ]
          </div>
          <h2 class="text-2xl font-black text-text mb-2">MEMORY EMPTY</h2>
          <p class="text-xs font-mono tracking-widest text-text-secondary normal-case">
            Ceritakan dirimu ke agent di chat — fakta akan tersimpan otomatis.
          </p>
        </div>

        <div v-else class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="group in groupedFacts"
            :key="group.category"
            class="border border-border bg-surface-secondary"
          >
            <div class="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-tertiary">
              <span class="text-[10px] font-mono tracking-widest text-text-secondary">
                [ {{ group.category.toUpperCase() }} ]              </span>
              <span class="text-[10px] font-mono tracking-widest text-text-tertiary">
                {{ group.facts.length }}
              </span>
            </div>
            <div class="divide-y divide-border">
              <div v-for="fact in group.facts" :key="fact.key" class="px-4 py-3">
                <template v-if="editingKey === fact.key">
                  <textarea
                    v-model="editingContent"
                    rows="2"
                    class="w-full bg-surface border border-border px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:border-primary focus:outline-none resize-none"
                  ></textarea>
                  <div class="flex gap-2 mt-2">
                    <button
                      class="px-3 py-1.5 text-[10px] font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover transition-colors"
                      @click="saveEdit(fact.key)"
                    >
                      [ SAVE ]
                    </button>
                    <button
                      class="px-3 py-1.5 text-[10px] font-mono tracking-widest text-text-secondary border border-border hover:text-text transition-colors"
                      @click="cancelEdit"
                    >
                      [ CANCEL ]
                    </button>
                  </div>
                </template>
                <template v-else>
                  <p class="text-sm text-text leading-5">{{ fact.content }}</p>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-[10px] font-mono tracking-widest text-text-tertiary">
                      {{ formatDate(fact.updated_at) }}
                    </span>
                    <div class="flex gap-1">
                      <button
                        class="p-1.5 text-text-tertiary border border-border hover:text-text hover:border-border-hover transition-colors"
                        title="Edit fact"
                        @click="startEdit(fact)"
                      >
                        <PhPencilSimple class="w-3.5 h-3.5" />
                      </button>
                      <button
                        class="p-1.5 text-text-tertiary border border-border hover:text-error hover:border-error transition-colors"
                        title="Delete fact"
                        @click="deleteFact(fact.key)"
                      >
                        <PhTrash class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
