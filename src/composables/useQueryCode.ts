import { ref, onMounted, readonly, type Ref } from 'vue'

// Extracts Vue SFC source code from URL query parameters.
// Supports:
//   ?code=<uri_encoded_sfc_string>  → decode directly
//   ?url=<http_url>                 → fetch code from external URL
export function useQueryCode() {
  const code: Ref<string> = ref('')
  const loading = ref(false)
  const error = ref('')

  async function loadFromUrl(url: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      code.value = await res.text()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch code from URL'
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    const params = new URLSearchParams(window.location.search)
    const codeParam = params.get('code')
    const urlParam = params.get('url')

    if (codeParam) {
      try {
        code.value = decodeURIComponent(codeParam)
      } catch {
        error.value = 'Failed to decode "code" parameter'
      }
    } else if (urlParam) {
      await loadFromUrl(urlParam)
    }
  })

  return { code: readonly(code), loading: readonly(loading), error: readonly(error) }
}
