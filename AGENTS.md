# CV Tailor Frontend — Agent Guide

## Tech Stack
- **Framework:** Vue 3 + Composition API + TypeScript
- **Build Tool:** Vite 8
- **Routing:** Vue Router 5 (createWebHistory)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` Vite plugin)
- **Package Manager:** bun

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
├── main.ts              # createApp + router + tailwind import
├── App.vue              # <RouterView /> wrapper
├── router/
│   └── index.ts         # Vue Router config + navigation guards
├── composables/
│   ├── useAuth.ts       # Auth state: token (localStorage), login/register/logout
│   └── useApi.ts        # Fetch wrapper: api.get/post/delete with auto-auth-header
├── views/
│   ├── LoginView.vue    # /login
│   ├── RegisterView.vue # /register
│   ├── DashboardView.vue# /dashboard — list user's CVs
│   ├── TemplatesView.vue# /templates — gallery of templates
│   └── EditorView.vue   # /editor/:cvId — split chat + preview
├── components/
│   ├── NavBar.vue       # Top nav with user info + logout
│   ├── ChatPanel.vue    # Chat bubble UI (left panel)
│   ├── CVPreviewIframe.vue # iframe srcdoc with sandbox
│   └── VersionPanel.vue # Version history list + restore
├── types/
│   └── index.ts         # TS interfaces: User, CV, CVVersion, ChatMessage, etc.
└── assets/
    └── main.css         # @import "tailwindcss"
```

## Routes

| Path | View | Auth | Description |
|------|------|------|-------------|
| `/` | — | No | Redirects to /dashboard |
| `/login` | LoginView | No | Email/password form |
| `/register` | RegisterView | No | Email + display_name + password |
| `/dashboard` | DashboardView | Yes | List CVs, create new |
| `/templates` | TemplatesView | Yes | Pick template → create CV |
| `/editor/:cvId` | EditorView | Yes | Chat + iframe preview + versions |

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
- Props: `messages: ChatMessage[]` (role: 'user' | 'ai', content)
- Emits: `send(prompt: string)`
- Auto-scroll to bottom on new message
- Textarea + Send button (Enter to send)

### CVPreviewIframe
- Props: `html: string`
- Renders via `<iframe :srcdoc="html" sandbox="allow-scripts allow-popups" />`
- Empty state when no HTML

### VersionPanel
- Props: `cvId: number`, `currentHtml: string`
- Emits: `restored()` — after successful revert
- Fetches version list on mount
- Highlights current version, disables restore for current

### NavBar
- Shows when `isAuthenticated` is true
- Links: My CVs, Templates, Logout
- Shows `user.display_name`

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
- No manual HTML editing — 100% AI-driven by design
- Chat history is UI-only — not persisted
