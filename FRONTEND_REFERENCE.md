# HIP Frontend — Reference

> Everything needed to understand, run, and extend the `hip-frontend` Next.js app.
> Backend context lives in `hip/BACKEND_REFERENCE.md`.

---

## What is this?

A Next.js chat UI for the HIP insurance support AI agent. Users can:
- Chat with the agent about any insurance topic
- Upload policy PDFs for analysis
- Download AI-generated PDF guides (health, life, auto, home, travel)
- Use quick-action shortcuts for common queries

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Icons | lucide-react |
| API comms | Native `fetch` with SSE streaming via `ReadableStream` |
| Session storage | `localStorage` (userId + sessionId persisted per browser) |

---

## Project Structure

```
hip-frontend/
├── app/
│   ├── globals.css          ← design tokens (CSS vars), scrollbar, prose styles
│   ├── layout.tsx           ← root layout, suppressHydrationWarning on <body>
│   └── page.tsx             ← mounts <ChatWindow />
├── components/
│   ├── ChatWindow.tsx       ← main orchestrator: session init, SSE streaming, state
│   ├── Sidebar.tsx          ← logo, New Conversation button, quick action list
│   ├── Message.tsx          ← user/agent chat bubbles + PDF download buttons
│   ├── ChatInput.tsx        ← textarea, file attach (PDF/image), send button
│   ├── TypingIndicator.tsx  ← animated dots shown while agent is responding
│   └── WelcomeScreen.tsx    ← shown when no messages yet, suggestion chips
├── lib/
│   ├── api.ts               ← all backend calls (createSession, streamMessage, buildDownloadUrl)
│   └── session.ts           ← localStorage userId/sessionId helpers
├── .env.local               ← NEXT_PUBLIC_API_URL (not used directly, proxy handles it)
└── next.config.ts           ← Next.js rewrite proxy config
```

---

## How the Proxy Works (Critical)

The browser cannot call the EC2 backend directly due to CORS — the backend doesn't
send `Access-Control-Allow-Origin` headers for `localhost`.

**Solution:** Next.js rewrite proxy in `next.config.ts`:

```ts
// next.config.ts
rewrites() {
  return [{ source: "/api/backend/:path*", destination: "http://43.204.143.233:8000/:path*" }]
}
```

All API calls in `lib/api.ts` use `BASE_URL = "/api/backend"`. The browser hits
`localhost:3000/api/backend/...` and Next.js forwards server-side to the EC2. No CORS.

**If you change the backend URL**, update `NEXT_PUBLIC_API_URL` in Vercel environment variables (and `.env.local` locally). The `next.config.ts` rewrite reads from that env var.

---

## Session Management

Each browser gets a persistent `userId` + `sessionId` stored in `localStorage` (see `lib/session.ts`).

- On first load: random IDs are generated and stored
- On "New Conversation": `sessionId` is regenerated, `userId` stays the same
- `createSession` in `lib/api.ts` calls `POST /apps/my_agent/users/{userId}/sessions/{sessionId}`
- The backend returns `409` if the session already exists — **this is treated as success**, not an error

---

## SSE Streaming Logic (`lib/api.ts` → `streamMessage`)

```
POST /api/backend/run_sse  { streaming: true }
  ↓
ReadableStream reader reads chunks
  ↓
Buffer accumulates until \n-delimited lines
  ↓
Each "data: {...}" line is parsed as JSON
  ↓
Text chunks:  event.content.role === "model" && event.content.parts[].text
Artifacts:    event.actions.artifactDelta  (check EVERY event, not just model-role ones)
  ↓
Yields { text?, artifacts? } to ChatWindow
```

**Key insight:** `artifactDelta` arrives on tool-result events, which do NOT have `role: "model"`.
The old naive filter `if (role !== "model") continue` was silently dropping all PDF artifacts.
The fix: extract `artifactDelta` from every event, extract text only from model-role events.

---

## Component Details

### ChatWindow.tsx
- Initialises session on mount via `useEffect`
- Appends an empty agent placeholder message before streaming starts
- Updates the last message in-place on every SSE chunk using functional `setMessages` updater
- Handles the empty-placeholder cleanup if the agent returns nothing

### Message.tsx
- Renders user bubbles (right-aligned, indigo) and agent bubbles (left-aligned, dark)
- Light markdown rendering: bold (`**...**`), inline code (`` `...` ``), bullets, numbered lists, newlines
- If `msg.artifacts` is non-empty, renders a download button per artifact pointing to
  `GET /api/backend/download/my_agent/{userId}/{sessionId}/{filename}`

### ChatInput.tsx
- Auto-resizing textarea (Shift+Enter for newline, Enter to send)
- File picker (PDF or image) — reads as base64 via `FileReader`, stores in component state
- On send: passes `{ mimeType, data }` as `inlineData` to `streamMessage`

### Sidebar.tsx
- Quick actions are hardcoded prompts that call `onQuickPrompt` → directly triggers `handleSend`
- "New Conversation" calls `handleNewChat` which generates a new `sessionId` and re-inits

---

## Design System (CSS Variables)

Defined in `app/globals.css`, used inline via `style={{}}` throughout components:

| Variable | Purpose |
|---|---|
| `--bg` | Page background (`#0f1117`) |
| `--bg-card` | Sidebar + header background |
| `--bg-card2` | Input area, secondary surfaces |
| `--accent` | Primary indigo (`#6366f1`) — buttons, avatar |
| `--accent2` | Lighter indigo (`#818cf8`) — icons, highlights |
| `--accent-glow` | Glow shadow for hero icon |
| `--text` | Primary text |
| `--text-muted` | Secondary/placeholder text |
| `--border` | Subtle borders (`rgba(255,255,255,0.08)`) |
| `--user-bubble` | User message bubble background |
| `--agent-bubble` | Agent message bubble background |

---

## Running Locally

```bash
cd hip-frontend
npm install
npm run dev        # starts on localhost:3000
```

Requires the backend to be running at `http://43.204.143.233:8000` (or update `next.config.ts`).

## Production Build

```bash
npm run build
npm run start
```

---

## Known Issues & Gotchas

- `suppressHydrationWarning` is set on `<body>` — browser extensions (e.g. password managers)
  inject attributes that cause React hydration mismatches. This suppresses the harmless warning.
- Session IDs survive page refreshes intentionally — conversation history is preserved.
  Hit "New Conversation" to start fresh.
- PDF download links go through the proxy (`/api/backend/download/...`) so they work in dev.
  In production (if frontend and backend are on different domains), the proxy must be configured
  or the backend must add proper CORS + authentication headers.
- The agent text sometimes mentions the PDF filename in prose — don't parse filenames from text.
  Always use `artifactDelta` keys as the canonical filename source.

---

## Extending the Frontend

**Add a new quick action:** Edit the `quickActions` array in `components/Sidebar.tsx`.

**Add a new page/route:** Create `app/{route}/page.tsx` — App Router convention.

**Change backend URL:** Update `destination` in `next.config.ts` rewrites.

**Add auth:** Wrap `ChatWindow` with a session provider; pass `userId` from auth token instead
of generating it randomly in `localStorage`.
