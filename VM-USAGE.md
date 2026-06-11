# Vue Visualizer — Usage Guide

Render Vue SFC (Single File Component) code directly in the browser via URL query parameters. Designed for LLM-generated Vue components to be previewed instantly.

---

## Quick Start

```bash
bun install
bun dev          # → http://localhost:5173
```

---

## How LLMs Use This

### Method 1: `?code=` — pass SFC directly via URL

1. LLM generates a Vue SFC string.
2. Encode it with `encodeURIComponent()`.
3. Open or redirect to the encoded URL.

**LLM prompt example:**
> Generate a Vue SFC component, then encode it and open:  
> `http://localhost:5173/?code=` + `encodeURIComponent(sfc)`

**JavaScript snippet (LLM can execute in browser console):**
```js
const sfc = `<template>
  <div class="card">
    <h1>{{ msg }}</h1>
    <p>Counter: {{ count }}</p>
    <button @click="count++">Increment</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const msg = 'Hello from LLM!'
const count = ref(0)
</script>

<style scoped>
.card {
  padding: 2rem;
  border-radius: 12px;
  background: #4f46e5;
  color: white;
  text-align: center;
  font-family: sans-serif;
}
button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>`

location.href = '/?code=' + encodeURIComponent(sfc)
```

---

### Method 2: `?url=` — fetch SFC from external URL

Pass a URL that returns raw `.vue` source code. The app fetches it and renders.

```
http://localhost:5173/?url=https://example.com/my-component.vue
```

---

## Supported SFC Features

| Feature | Supported |
|---|---|
| `<template>` | Yes |
| `<script setup>` | Yes |
| `<script>` (Options API) | Yes |
| `<style scoped>` | Yes |
| `<style>` (global) | Yes |
| CSS `v-bind()` in `<style>` | Yes |
| Imports from `vue` (e.g. `ref`, `computed`, `watch`) | Yes |
| Custom component imports | No (single-SFC mode) |
| TypeScript (`lang="ts"`) | Limited (compiler v3.4.x) |

---

## UI

- **Preview mode** (default): Live-rendered component.
- **Source mode**: Read-only dark-themed code view.
- **Floating button** (bottom-right): Toggles between Preview and Source.

---

## URL Parameter Reference

| Param | Description | Example |
|---|---|---|
| `?code=` | URI-encoded Vue SFC string | `?code=%3Ctemplate%3E...` |
| `?url=` | External URL returning raw `.vue` source | `?url=https://example.com/comp.vue` |

If both `code` and `url` are present, `code` takes priority.

---

## Build for Production

```bash
bun run build    # outputs to dist/

# Serve the built files
bun preview      # → http://localhost:4173
```

---

## Architecture

```
URL (?code= or ?url=)
        │
        ▼
  useQueryCode.ts        — reads & decodes query params
        │
        ▼
  App.vue                — mode toggle + layout shell
        │
   ┌────┴────┐
   ▼         ▼
RenderPreview.vue    SourceCode.vue
(compile + mount)    (read-only display)
```

---

## Limitations

- Single SFC only — no multi-component imports.
- Compiler version is 3.4.x (bundled via `vue3-sfc-loader`). New Vue 3.5 SFC syntax may not compile.
- Bundle size: ~543 KB gzipped (includes compiler + Vue runtime).
