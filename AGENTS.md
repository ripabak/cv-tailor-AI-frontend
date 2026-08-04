# CV Tailor Frontend — Agent Guide

## Tech Stack
- **Framework:** Vue 3 + Composition API + TypeScript
- **Build Tool:** Vite 8
- **Routing:** Vue Router 5 (createWebHistory)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` Vite plugin)
- **Icons:** Phosphor Icons (`@phosphor-icons/vue`)
- **Font:** Inter Variable (`@fontsource-variable/inter`, self-hosted)
- **Package Manager:** bun

## Design System

- **Archetype:** Industrial Brutalism / Tactical Telemetry — dark CRT terminal, single hazard-red accent.
- **Palette:** near-black surface (`#0A0A0A`), off-white text (`#EAEAEA`), red accent (`#E61919`), terminal green (`#4AF626`) reserved for one status use.
- **Mode:** dual-mode (light default + dark via `.dark` class on `<html>`). Theme from `useTheme` composable (`cv-theme` in localStorage, default light). Anti-FOUC script in `index.html`.
- **Tokens:** defined in `src/shared-styles/tokens.css` and used as Tailwind utilities (`bg-surface`, `text-text`, `border-border`, etc.).
- **Radius:** zero — all corners are 90°.
- **Shadows:** none.
- **Icons:** Phosphor Icons via `@phosphor-icons/vue`. Import only the icons you need.
- **Typography:** JetBrains Mono for body/data; Inter Black for structural sans-serif headers.
- **Effects:** global CRT scanline overlay, `prefers-reduced-motion` support.

## How to Run

```bash
bun run dev      # development at http://localhost:5173
bun run build    # production build → dist/
```

Config via `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

## Project Structure

```
frontend/src/
├── main.ts                     # createApp + router + tailwind import
├── App.vue                     # <RouterView /> wrapper
├── router/
│   └── index.ts                # Vue Router config + navigation guards
├── composables/
│   ├── useAuth.ts              # Auth state: token (localStorage), login/register/logout
│   └── useApi.ts               # Fetch wrapper: api.get/post/delete with auto-auth-header
├── views/
│   ├── LandingView.vue         # / — marketing landing page
│   ├── LoginView.vue           # /login
│   ├── RegisterView.vue        # /register
│   ├── DashboardView.vue       # /dashboard — list user's CVs
│   ├── TemplatesView.vue       # /templates — gallery of templates
│   ├── EditorView.vue          # /editor/:cvId — split chat + preview
│   ├── MemoryView.vue          # /memory — kelola long-term memory agent
│   └── PublicCVView.vue        # /cv/:slug — public redirect
├── components/
│   ├── NavBar.vue              # Top nav with user info + logout
│   ├── ChatPanel.vue           # Chat bubble UI (left panel)
│   ├── CVPreviewIframe.vue     # iframe srcdoc with sandbox
│   ├── CVPreviewCard.vue       # Thumbnail card for CVs and templates
│   ├── Pagination.vue          # Page controls
│   ├── ShareModal.vue          # Copy public link
│   ├── VersionTimeline.vue     # Compact version history
│   └── chat/                   # Chat sub-components
├── types/
│   └── index.ts                # TS interfaces
├── shared-styles/
│   ├── tokens.css              # Color, radius, shadow tokens + dark mode
│   └── base.css                # Base typography, markdown, scrollbar styles
└── assets/
    └── main.css                # Font + tailwind + tokens + base
```

## Routes

| Path | View | Auth | Description |
|------|------|------|-------------|
| `/` | LandingView | No | Marketing landing page |
| `/login` | LoginView | No | Email/password form |
| `/register` | RegisterView | No | Email + display_name + password |
| `/dashboard` | DashboardView | Yes | List CVs, create new |
| `/templates` | TemplatesView | Yes | Pick template → create CV |
| `/editor/:cvId` | EditorView | Yes | Chat + iframe preview + versions |
| `/memory` | MemoryView | Yes | Kelola long-term memory (user + per-CV facts) |
| `/cv/:slug` | PublicCVView | No | Redirect to public bare CV |

**Guard:** Router beforeEach checks localStorage `token`. If missing and route requires auth → redirect `/login`. If token exists and on login/register → redirect `/dashboard`.

## Key Composables

### `useAuth()`
```ts
const { token, user, isAuthenticated, login, register, logout, fetchUser } = useAuth()
```
- Token stored in `localStorage` key `"token"`
- `fetchUser()` called automatically on init if token exists
- `logout()` clears token + user

### `useApi` (plain object, not a composable)
```ts
api.get<T>('/path')
api.post<T>('/path', body)
api.patch<T>('/path', body)
api.delete<T>('/path')
```
- Auto-injects `Authorization: Bearer <token>` header
- Base URL from `VITE_API_URL` env (default `http://localhost:8000/api`)
- Throws Error with `.detail` from backend

## Components

### ChatPanel
- Props: `messages: StreamMessage[]`, `isStreaming: boolean`, `totalUsage: object`
- Emits: `send(prompt: string)`, `clear`, `stop`
- Auto-scroll to bottom on new message
- Textarea + Send button (Enter to send)
- Tool-call bubbles with status + expandable output

### CVPreviewIframe / MobileCVPreview
- Props: `html: string`
- Renders via `<iframe :srcdoc="html" sandbox="..." />`
- Empty state when no HTML
- Exposes `print()`, `saveScroll()`, `restoreScroll()`, `getHTML()`, `iframeRef`; `editable` prop toggles contentEditable + emits `save` on Cmd/Ctrl+S

### CVPreviewCard
- Props: `title`, `html`, `subtitle`, `loading`
- Emits: `click`
- Scaled A4 iframe thumbnail with optional actions slot

### NavBar
- Sticky top nav, shows when `isAuthenticated` is true
- Links: My CVs, Templates, Logout
- Shows `user.display_name`

### Pagination
- Props: `page`, `totalPages`
- Emits: `change(page)`

### ShareModal
- Props: `visible`, `url`
- Emits: `close`
- Copy-to-clipboard with feedback

### ToolCallBubble
- Props: `name`, `status`
- Memory tools (`list_categories`, `get_memory`, `save_fact`, `delete_fact`) ditandai ikon `Brain`

## Editor Flow (EditorView)

1. On mount → `GET /api/cv/:cvId` → load latest HTML
2. User types prompt → `POST /api/cv/:cvId/generate` → gets new HTML
3. Chat messages stored in local `messages` ref (NOT persisted to DB)
4. Print button calls `iframe.contentWindow.print()`

## Adding New Features

### New Page
1. Create `src/views/NewPage.vue`
2. Add route in `router/index.ts`
3. Add to NavBar if needed

### New Component
1. Create in `src/components/`
2. Import locally in view (not globally registered)

### New API Call
1. Add interface in `types/index.ts` if response type is new
2. Call via `api.get/post/delete` from composables/views

## Key Conventions
- Use `<script setup lang="ts">` — no Options API
- Path alias `@/` maps to `src/`
- No Pinia — auth state managed via composable (sufficient for MVP scope)
- Primary editing flow is AI-driven via chat; optional direct edit mode (contentEditable in iframe) saves via `POST /api/cv/:cvId/html` as a new version
- Chat history is UI-only — not persisted
