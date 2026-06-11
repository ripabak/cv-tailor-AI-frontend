# Vue Visualizer — Usage Guide

Render Vue SFC (Single File Component) code directly in the browser via URL query parameters. Designed for LLM-generated Vue components to be previewed instantly.

---

## Quick Start

```bash
bun install
bun dev          # → http://localhost:5173
```

---

## How to Encode a `.vue` File into a URL

The app accepts Vue SFC source code via the `?code=` query parameter.  
The code must be **URI-encoded** using `encodeURIComponent()` so special characters  
(`<`, `>`, `{`, `}`, `"`, newlines, etc.) do not break the URL.

### Step-by-step

Take this Vue SFC:

```vue
<template>
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
</style>
```

Encode it with `encodeURIComponent()`:

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

const url = 'http://localhost:5173/?code=' + encodeURIComponent(sfc)
console.log(url)
```

Result (ready to open in browser):

```
http://localhost:5173/?code=%3Ctemplate%3E%0A%20%20%3Cdiv%20class%3D%22card%22%3E%0A%20%20%20%20%3Ch1%3E%7B%7B%20msg%20%7D%7D%3C%2Fh1%3E%0A%20%20%20%20%3Cp%3ECounter%3A%20%7B%7B%20count%20%7D%7D%3C%2Fp%3E%0A%20%20%20%20%3Cbutton%20%40click%3D%22count%2B%2B%22%3EIncrement%3C%2Fbutton%3E%0A%20%20%3C%2Fdiv%3E%0A%3C%2Ftemplate%3E%0A%0A%3Cscript%20setup%3E%0Aimport%20%7B%20ref%20%7D%20from%20%27vue%27%0Aconst%20msg%20%3D%20%27Hello%20from%20LLM!%27%0Aconst%20count%20%3D%20ref(0)%0A%3C%2Fscript%3E%0A%0A%3Cstyle%20scoped%3E%0A.card%20%7B%0A%20%20padding%3A%202rem%3B%0A%20%20border-radius%3A%2012px%3B%0A%20%20background%3A%20%234f46e5%3B%0A%20%20color%3A%20white%3B%0A%20%20text-align%3A%20center%3B%0A%20%20font-family%3A%20sans-serif%3B%0A%7D%0Abutton%20%7B%0A%20%20margin-top%3A%200.5rem%3B%0A%20%20padding%3A%200.5rem%201rem%3B%0A%20%20border%3A%20none%3B%0A%20%20border-radius%3A%206px%3B%0A%20%20cursor%3A%20pointer%3B%0A%7D%0A%3C%2Fstyle%3E
```

### One-liner redirect (browser console)

Paste this into the browser console on `http://localhost:5173` to jump straight to the rendered component:

```js
location.href = '/?code=' + encodeURIComponent(`<template>
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
</style>`)
```

### Node.js / Bun script

```bash
# From a .vue file on disk
bun -e "console.log('http://localhost:5173/?code=' + encodeURIComponent(require('fs').readFileSync('MyComponent.vue','utf8')))"
```

---

## How LLMs Use This

### Method 1: `?code=` — pass SFC directly via URL

1. LLM generates a Vue SFC string.
2. Encode it with `encodeURIComponent()` (see section above).
3. Open or redirect to the encoded URL.

**LLM prompt example:**
> Generate a Vue SFC component, then encode it with `encodeURIComponent()` and open:  
> `http://localhost:5173/?code=` + `encodeURIComponent(sfc)`

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
