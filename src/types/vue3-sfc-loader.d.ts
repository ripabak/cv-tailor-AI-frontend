declare module 'vue3-sfc-loader' {
  import type { Component } from 'vue'

  interface Path {
    path: string
  }

  export interface Options {
    moduleCache?: Record<string, unknown>
    getFile?: (url: string) => string | Promise<string>
    addStyle?: (textContent: string, scopeId?: string) => void
    getCustomBlock?: (block: { type: string; src?: string; content?: string; attrs?: Record<string, string | boolean> }) => void
    [key: string]: unknown
  }

  export function loadModule(path: string | Path, options?: Options): Promise<Component>
}
