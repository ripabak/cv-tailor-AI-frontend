<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToRegister() {
  router.push('/register')
}

function goToTemplates() {
  router.push('/templates')
}

function goToLogin() {
  router.push('/login')
}

const features = [
  {
    label: 'CHAT TO BUILD',
    body: 'Describe your experience in plain language. The agent asks the right questions and turns answers into a polished CV.',
  },
  {
    label: 'REMEMBERS YOUR STORY',
    body: 'Add a detail once and reuse it across versions. No more retyping the same job history every time.',
  },
  {
    label: 'SHARE WITH A LINK',
    body: 'Publish a clean public page in one click. Visitors see the CV instantly, no attachments needed.',
  },
] as const

const steps = [
  { num: '01', label: 'DESCRIBE YOUR EXPERIENCE', body: 'Tell the agent what you have done in plain language.' },
  { num: '02', label: 'WATCH IT TAKE SHAPE', body: 'The agent formats your story into a professional CV.' },
  { num: '03', label: 'PUBLISH OR DOWNLOAD', body: 'Share a link or print a PDF when you are ready.' },
]
</script>

<template>
  <div class="min-h-[100dvh] bg-surface">
    <!-- Header -->
    <header class="sticky top-0 z-50 h-14 border-b border-border bg-surface">
      <div class="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        <router-link to="/" class="font-sans text-sm font-black tracking-tighter text-text">
          CV TAILOR<span class="text-text-tertiary">™</span>
        </router-link>
        <div class="flex items-center gap-2">
          <button
            @click="goToLogin"
            class="px-3 py-1.5 text-xs font-mono tracking-widest text-text-secondary border border-border hover:bg-surface-secondary hover:text-text transition-colors"
          >
            [ LOG IN ]
          </button>
          <button
            @click="goToRegister"
            class="px-3 py-1.5 text-xs font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover transition-colors"
          >
            [ GET STARTED ]
          </button>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-12 md:pb-16">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div class="lg:col-span-8">
              <div class="inline-block px-2 py-1 border border-primary text-primary text-[10px] font-mono tracking-widest mb-6">
                [ AI-POWERED CV BUILDER ]
              </div>
              <h1 class="text-[clamp(3rem,10vw,10rem)] font-black leading-[0.85] tracking-[-0.04em] text-text uppercase">
                BUILD A<br>CV THAT<br><span class="text-primary">GETS YOU</span><br>HIRED.
              </h1>
            </div>
            <div class="lg:col-span-4 flex flex-col gap-6">
              <p class="text-sm font-mono leading-relaxed text-text-secondary normal-case">
                Describe your experience in plain language. Our agent remembers your story and shapes a clean, professional CV.
              </p>
              <div class="flex flex-col sm:flex-row gap-2">
                <button
                  @click="goToRegister"
                  class="px-5 py-3 text-xs font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover transition-colors"
                >
                  GET STARTED >>>
                </button>
                <button
                  @click="goToTemplates"
                  class="px-5 py-3 text-xs font-mono tracking-widest text-text-secondary border border-border hover:bg-surface-secondary hover:text-text transition-colors"
                >
                  [ VIEW TEMPLATES ]
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Telemetry strip -->
        <div class="border-t border-border bg-surface-secondary">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] font-mono tracking-widest text-text-tertiary">
            <span>REV 01</span>
            <span class="text-primary">STATUS: ONLINE</span>
            <span>UNIT CV-01</span>
            <span>MODE: DARK</span>
            <span class="ml-auto">SYSTEM: READY</span>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div class="lg:col-span-5">
              <h2 class="text-4xl md:text-5xl font-black leading-[0.9] tracking-[-0.03em] text-text">
                LESS FORM<br><span class="text-primary">FILLING</span>, MORE STORYTELLING.
              </h2>
            </div>
            <div class="lg:col-span-7 lg:pt-4">
              <p class="text-sm font-mono leading-relaxed text-text-secondary normal-case max-w-2xl">
                CV Tailor is built around a conversation. You focus on what you have done; the agent handles the rest.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 border border-border">
            <div
              v-for="(feature, i) in features"
              :key="feature.label"
              class="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border last:border-r-0"
              :class="{ 'md:border-b-0': i !== 2 }"
            >
              <div class="text-[10px] font-mono tracking-widest text-primary mb-4">
                [ {{ feature.label }} ]
              </div>
              <p class="text-xs font-mono leading-relaxed text-text-secondary normal-case">
                {{ feature.body }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <h2 class="text-sm font-mono tracking-widest text-text-tertiary border border-border inline-block px-3 py-1 mb-10">
            [ HOW IT WORKS ]
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
            <div
              v-for="step in steps"
              :key="step.num"
              class="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border last:border-r-0"
            >
              <div class="text-5xl font-black text-text-tertiary mb-4 font-sans">
                {{ step.num }}
              </div>
              <div class="text-[10px] font-mono tracking-widest text-primary mb-2">
                [ {{ step.label }} ]
              </div>
              <p class="text-xs font-mono leading-relaxed text-text-secondary normal-case">
                {{ step.body }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div class="border border-border p-8 md:p-12 bg-surface-secondary">
            <h2 class="text-4xl md:text-6xl font-black leading-[0.85] tracking-[-0.03em] text-text mb-4">
              READY TO<br>GET HIRED?
            </h2>
            <p class="text-sm font-mono leading-relaxed text-text-secondary normal-case max-w-xl mb-6">
              Start with a template, then chat your way to a CV that fits your next role.
            </p>
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                @click="goToRegister"
                class="px-6 py-3 text-xs font-mono tracking-widest bg-primary text-primary-on border border-primary hover:bg-primary-hover transition-colors"
              >
                GET STARTED >>>
              </button>
              <button
                @click="goToTemplates"
                class="px-6 py-3 text-xs font-mono tracking-widest text-text-secondary border border-border hover:bg-surface hover:text-text transition-colors"
              >
                [ VIEW TEMPLATES ]
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono tracking-widest text-text-tertiary">
        <span class="font-sans text-sm font-black text-text">CV TAILOR<span class="text-text-tertiary">®</span></span>
        <span>BUILT FOR PEOPLE WHO WANT A BETTER CV, FASTER.</span>
      </div>
    </footer>
  </div>
</template>
