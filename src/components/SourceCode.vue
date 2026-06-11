<script setup lang="ts">
defineProps<{
  code: string
}>()
</script>

<template>
  <div class="source-code">
    <pre class="code-block"><code>{{ code || '// No source code provided' }}</code></pre>
  </div>
</template>

<style scoped>
.source-code {
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  background: #1e1e1e;
  box-sizing: border-box;
}

.code-block {
  margin: 0;
  padding: 1.5rem;
  background: #2d2d2d;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #d4d4d4;
}

.code-block code {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
