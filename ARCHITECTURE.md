# WorldofNovel — Architecture

This document describes how WorldofNovel is built and how data flows through the system
`<https://localhost>`.

## System overview

```
                    ┌────────────────────────────────────────────────┐
                    │                   Browser                       │
                    │   React SPA (you are reading it)                │
                    └───────────────┬───────────────┬────────────────┘
                                    │               │
                        same-origin │               │ uploaded files
                        (Vite proxy / nginx)        │
                                    ▼               ▼
                    ┌────────────────────────────────────────────────┐
                    │                 Backend (Express)               │
                    │  routers ──▶ services ──▶ Prisma ──▶ PostgreSQL │
                    │                    └──▶ StorageProvider ──▶disk │
                    └────────────────────────────────────────────────┘
```

In development, Vite proxies `/api` and `/uploads` to `localhost:4000`. In the Docker
deployment, nginx performs the same forwarding to the `backend` service.

## Repository layout

```
backend/
  prisma/
    schema.prisma            database models + indexes
    migrations/              versioned SQL migrations
  src/
    config/env.ts            validated environment variables (zod)
    config/genres.ts         canonical genre list
    lib/prisma.ts            Prisma client singleton
    lib/jwt.ts               token sign/verify
    lib/httpError.ts         error helper (throws with status + code)
    lib/document.ts          TipTap-doc helpers (word count, empty checks)
    middleware/              auth (JWT cookie), validate (zod), errorHandler
    routes/                  auth, google, novels, chapters, uploads
    services/                business logic + ownership checks
    services/storage/        StorageProvider interface + LocalStorageProvider
    __tests__/               Vitest + Supertest integration tests
  uploads/                   local storage for covers + chapter images
frontend/
  src/
    api/                     typed client (fetchJson, uploadFile) per resource
    hooks/                   useAuth (AuthProvider), useTheme, usePageTitle
    components/ui/           Button, Input, Modal, Toast, ConfirmDialog, ...
    components/editor/       TipTap editor + toolbar + image dialog
    components/dashboard/    novel cards, create/edit modals
    components/workspace/    chapter sidebar (dnd), editor pane shell
    pages/                   Landing, Login, Register, Dashboard, NovelWorkspace, NotFound
    lib/                     types, constants, utils, editor-utils
```

## Backend

### Data model (PostgreSQL via Prisma)

- **User** — name, email (unique), password hash (nullable for OAuth), Google id/email,
  avatar URL, timestamps.
- **Novel** — title, description, genre, author name, cover URL, plus
  `lastOpenedChapterId` / `lastOpenedAt` for resume-writing. Belongs to a user.
- **FrontMatter** — one per novel; stores the TipTap JSON document for the dedication/preface
  page.
- **Chapter** — title, `chapterOrder`, `content` (TipTap JSON), `wordCount` (computed
  server-side on save), belongs to a novel. Novel + chapter scoped to the owning user.
- **Image** — a record for every uploaded image, keyed to the owning user and optionally a
  novel/chapter for future cleanup/reuse.

### Request flow

1. A request arrives at the Express app (`src/index.ts`).
2. Middleware stack: `helmet`, `cors` (only `FRONTEND_URL`, credentials), `cookieParser`,
   error handling.
3. Routers validate bodies with zod; `requireAuth` reads the `won_token` cookie, verifies the
   JWT, and resolves the user.
4. Services enforce ownership at every query (e.g. `findFirst({ id, userId })`), so one user can
   never read or write another user's data. Cross-user lookups return **404** (not 403) to avoid
   revealing resource existence.
5. Responses are JSON; the error handler maps `HttpError`s to `{ error, code }` shaped
   responses.

### Authentication

- **Email/password**: bcrypt-hashed passwords; login issues a JWT stored in the
  `won_token` httpOnly cookie (`SameSite=Lax`, `HttpOnly`, `Secure` in production). Logout
  clears the cookie.
- **Google OAuth**: manual authorization-code flow. `/api/auth/google` redirects to Google;
  the callback exchanges the code, upserts or links the user, issues the same JWT cookie.
  The flow is entirely gate-keeper by `GOOGLE_CLIENT_ID/SECRET` being set — the health endpoint
  reports `googleConfigured` so the UI can hide/enable the button.

### Storage abstraction

```ts
interface StorageProvider {
  save(buffer, { mime, size }): Promise<{ key, url }>
  remove?(key): Promise<void>
  toPublicUrl(key): string
}
```

`LocalStorageProvider` writes to `uploads/` and serves files through Express static routing at
`/uploads/...`. The Image table records every file; a blob-backed provider (e.g. Azure Blob
Storage) can be added without touching the routes.

## Frontend

### State & data flow

- **TanStack Query** owns server state. Keys: `['novels']` for the dashboard list,
  `['novels', id]` for a detail, `['novels', id, 'chapters']` for chapter documents.
- **AuthProvider** (`useAuth`) bootstraps from `/api/auth/me` on load and exposes
  `user`, `login`, `register`, `logout`.
- Every API call goes through `fetchJson`/`uploadFile` in `api/client.ts`, which sends
  credentials, parses JSON, and throws typed `ApiError`s — pages surface `err.message` directly.

### Writing flow (autosave)

- The `Editor` emits TipTap JSON on every change. The workspace keeps the newest document in a
  `PendingSave` ref and debounces persistence by 1.8 s.
- On timer fire (or before switching chapters / leaving the page) the pending document is sent to
  `PUT /api/chapters/:id` (or the front-matter endpoint) — the server recomputes `wordCount`.
- The top bar shows *Unsaved changes → Saving… → Saved*. A `beforeunload` guard warns about
  any in-flight text.
- The dashboard's resume cards use `lastOpenedChapterId` recorded via the progress endpoint.

### Workspace layout

`h-dvh` app bar → two-pane layout:
- **Sidebar**: dnd-kit sortable chapter list (drag to reorder → `POST /novels/:id/reorder`),
  inline rename, delete, "new chapter", and front-matter entry pinned first.
- **Editor pane**: chapter title input (saves on blur), TipTap editor with toolbar, image
  insertion (upload then insert), live word count.

## API surface

| Method | Route                                  | Purpose                        |
| ------ | -------------------------------------- | ------------------------------ |
| POST   | `/api/auth/register`                   | create account, set cookie     |
| POST   | `/api/auth/login`                      | sign in, set cookie            |
| POST   | `/api/auth/logout`                     | clear cookie                   |
| GET    | `/api/auth/me`                         | current user                   |
| GET    | `/api/auth/google`                     | start OAuth redirect           |
| GET    | `/api/auth/google/callback`            | OAuth callback                 |
| GET    | `/api/health`                          | liveness + `googleConfigured`  |
| GET/POST| `/api/novels`                         | list / create novels           |
| GET/PUT/DELETE | `/api/novels/:id`             | read / update / delete novel   |
| PUT    | `/api/novels/:id/progress`             | set `lastOpenedChapterId`      |
| POST   | `/api/novels/:id/reorder`              | persist chapter order          |
| GET/POST | `/api/novels/:id/chapters`           | list (with content) / create   |
| GET/PUT | `/api/novels/:id/front-matter`       | read / update front matter     |
| PUT/DELETE | `/api/chapters/:id`               | update / delete a chapter      |
| POST   | `/api/uploads/cover`                   | upload a cover image           |
| POST   | `/api/uploads/image`                   | upload an inline image         |

## Security notes

- JWT uses `expiresIn`; secrets come from environment (`JWT_SECRET`), never committed.
- Passwords hashed with bcrypt (cost 10).
- Ownership enforced in services; ids are opaque (`cuid`).
- Uploads restricted to image mimetypes, size-capped (cover 10 MB, inline 5 MB), served from a
  dedicated prefix.
- Production settings: `COOKIE_SECURE=true`, unique `JWT_SECRET`, HTTPS termination, managed
  database.

## Testing

Backend tests are Vitest + Supertest integration tests against a dedicated `worldofnovel_test`
database (recreated by a global setup that runs `prisma migrate reset`). `vitest.config.ts` uses
`fileParallelism: false` because test files share one database. Frontend is validated with
`tsc -b` (type-check), a production `vite build`, and oxlint.