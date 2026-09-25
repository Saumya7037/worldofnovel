# WorldofNovel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "WorldofNovel" — a complete, locally-runnable personal novel-writing platform with auth (email/password + Google), novels/chapters/front matter, TipTap rich editor, image uploads, autosave, resume-writing, and a distinctive "ink & parchment" UI.

**Architecture:** Modular monolith monorepo. `frontend/` = React + Vite + TS + Tailwind + TipTap (port 5173, Vite proxies `/api` and `/uploads` to backend). `backend/` = Express + TS + Prisma + PostgreSQL (port 4000), JWT in httpOnly cookie, storage behind a `StorageProvider` interface for future Azure Blob swap. `docs/` holds ARCHITECTURE.md and DEPLOYMENT_GUIDE.md.

**Tech Stack:**
- Frontend: React, Vite, TypeScript, Tailwind CSS, react-router-dom, @tanstack/react-query, TipTap (@tiptap/react + starter-kit + underline/placeholder/character-count/text-align/link/image), @dnd-kit/core + @dnd-kit/sortable, lucide-react, @fontsource packages.
- Backend: Node, Express, TypeScript, Prisma, PostgreSQL 18 (local), bcryptjs, jsonwebtoken, zod, multer, helmet, cookie-parser. Tests: vitest + supertest.
- Infra docs: Dockerfile (backend + multi-stage frontend), docker-compose.yml, .dockerignore.

**Spec:** `Novel_Application_AI_Build_Instructions.md` (in repo root — travel with this plan; the plan argues from the spec).

## Global Constraints

- App name: **WorldofNovel**.
- Must run fully locally. Google OAuth must work without credentials (feature gated/indicated) and secrets come only from env vars.
- Never trust a client-supplied userId — resolve user from JWT.
- Never store plaintext passwords; hash with bcrypt.
- Authoritative persistence in PostgreSQL (not localStorage); last-edited chapter stored on Novel (`lastOpenedChapterId`/`lastOpenedAt`) for resume.
- Content stored as TipTap JSON documents in DB; `wordCount` computed server-side on save.
- Uploads validated (MIME whitelist jpeg/png/webp/gif, size limits), randomized filenames, stored behind a storage abstraction.
- No production secrets committed. `.env` never committed. `.env.example` provides all variables.
- Protect against cross-user novel/chapter access at the query layer.
- UI must not look like a plain CRUD dashboard: distinctive editorial theme, light/dark mode, loading/empty/error states, responsive (dashboard + workspace drawer on mobile).
- Destructive actions require confirmation.
- Deliverables: full source, Prisma migrations, `.env.example`, local-setup README, ARCHITECTURE.md, DEPLOYMENT_GUIDE.md (beginner), Docker files.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `.gitignore`, `.env.example`, `backend/**` scaffold, `frontend/**` scaffold (via create-vite react-ts)
- Modify: — 

**Interfaces:**
- Consumes: Node v22, npm, local PostgreSQL 18 on localhost:5432.
- Produces: runnable `backend` (Express+TS) and `frontend` (Vite+React+TS) skeletons with Vite proxy for `/api` and `/uploads`.

- [ ] Scaffold `frontend` via `npm create vite@latest frontend -- --template react-ts`; scaffold `backend` manually (package.json, tsconfig, src/index.ts "hello").
- [ ] Install backend deps: express, cors, cookie-parser, helmet, bcryptjs, jsonwebtoken, zod, multer, @prisma/client, dotenv; dev: typescript, tsx, @types/*, prisma, vitest, supertest, @types/supertest.
- [ ] Install frontend deps: react-router-dom, @tanstack/react-query, @tiptap/*, @dnd-kit/*, lucide-react, tailwindcss, @fontsource/*; dev vite@latest already.
- [ ] Configure `frontend/vite.config.ts` proxy: `/api` and `/uploads` → `http://localhost:4000`.
- [ ] Configure Tailwind (v4 via @tailwindcss/vite), fonts, base styles.
- [ ] Verify: both servers boot.

### Task 2: Prisma Schema + Migrations

**Files:**
- Create: `backend/prisma/schema.prisma`, migration via `prisma migrate dev`
- Modify: `backend/package.json` (db scripts)

**Interfaces:**
- Produces: Prisma client with models `User`, `Novel`, `FrontMatter`, `Chapter`, `Image`; `genres` constant in `backend/src/config/genres.ts`.

- [ ] Write schema (User id/name/email unique/passwordHash/googleId unique/avatarUrl; Novel id/userId FK/title/description/authorName/genre/coverImageUrl/lastOpenedChapterId/lastOpenedAt/timestamps; FrontMatter id/novelId unique FK/content Json; Chapter id/novelId FK/title/content Json/chapterOrder/wordCount/timestamps; Image id/userId/novelId?/chapterId?/fileName/filePath/mimeType).
- [ ] `.env`: `DATABASE_URL=postgresql://postgres:toor@localhost:5432/worldofnovel`.
- [ ] Create DB `worldofnovel`; run `prisma migrate dev --name init`.
- [ ] Add `backend/src/config/genres.ts` (extensible array).

### Task 3: Backend Core

**Files:**
- Create: `backend/src/config/env.ts`, `backend/src/lib/prisma.ts`, `backend/src/lib/httpError.ts`, `backend/src/middleware/auth.ts`, `backend/src/middleware/validate.ts`, `backend/src/middleware/errorHandler.ts`, `backend/src/app.ts`
- Test: `backend/src/__tests__/authMiddleware.test.ts`, `backend/src/__tests__/validate.test.ts`

**Interfaces:**
- Produces: `requireAuth` middleware attaching `req.user = { id, email, name }`; `HttpError` class (status + message); `validate(schema)` zod middleware; `errorHandler` returning `{ error: message }` JSON.
- Consumes: env config (`JWT_SECRET`, `FRONTEND_URL`, ports).

- [ ] TDD auth middleware + validate middleware tests.
- [ ] Implement env/prisma/httpError/middlewares.

### Task 4: Auth API

**Files:**
- Create: `backend/src/routes/auth.ts`, `backend/src/services/authService.ts`
- Test: `backend/src/__tests__/auth.test.ts`

**Interfaces:**
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. JWT in httpOnly cookie `won_token`. Error messages: "Incorrect email or password.", "Email is already registered.", etc.
- Consumes: `requireAuth`, bcrypt, jwt.

- [ ] TDD: register/login/logout/me; duplicate email; wrong password; protected route rejects.
- [ ] Implement; cookie `SameSite=Lax`, `httpOnly`, `secure` in production.

### Task 5: Google OAuth

**Files:**
- Create: `backend/src/routes/google.ts`, `backend/src/services/googleService.ts`

**Interfaces:**
- Produces: `GET /api/auth/google` (redirect to Google), `GET /api/auth/google/callback` (exchange code, upsert user, set cookie, redirect to FRONTEND_URL/dashboard).
- Consumes: env `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`.

- [ ] Implement manual OAuth2 authorization-code flow (no library hardening needed — use Node fetch).
- [ ] If env creds absent, route responds with a clear JSON error and frontend shows "Google login is not configured" state. Documented as credential-gated (cannot be locally verified without creds).

### Task 6: Storage + Uploads

**Files:**
- Create: `backend/src/services/storage/provider.ts` (interface), `backend/src/services/storage/local.ts`, `backend/src/routes/uploads.ts`
- Test: `backend/src/__tests__/uploads.test.ts`

**Interfaces:**
- Produces: `StorageProvider.save(file) → { url, filePath }`; `app.use('/uploads', express.static(uploadsDir))`; `POST /api/uploads/cover`, `POST /api/uploads/image` (multer memory storage, 10MB limit, MIME whitelist).

- [ ] TDD upload route tests (accept jpeg/png/webp/gif, reject others, size limit).
- [ ] Implement provider + routes.

### Task 7: Novels API

**Files:**
- Create: `backend/src/routes/novels.ts`, `backend/src/services/novelService.ts`
- Test: `backend/src/__tests__/novels.test.ts`

**Interfaces:**
- Produces: `GET /api/novels` (own, with `chapterCount`, `wordCount`, `lastChapterTitle`, `lastOpenedAt`), `POST /api/novels` (plus optional frontMatter + cover), `GET /api/novels/:id` (with chapters ordered + frontMatter), `PUT /api/novels/:id`, `DELETE /api/novels/:id`, `PUT /api/novels/:id/progress` `{chapterId}` → sets lastOpened fields.
- Consumes: `requireAuth`.

- [ ] TDD: create (default front matter created), list aggregates, update, delete, ownership (User B cannot read/modify User A), progress updates.
- [ ] Implement.

### Task 8: Chapters API

**Files:**
- Create: `backend/src/routes/chapters.ts`, `backend/src/services/chapterService.ts`
- Test: `backend/src/__tests__/chapters.test.ts`

**Interfaces:**
- Produces: `POST /api/novels/:novelId/chapters` ({title,content}), `PUT /api/chapters/:id` ({title?,content?} → recomputes wordCount from TipTap JSON text), `DELETE /api/chapters/:id`, `POST /api/novels/:novelId/reorder` ({orderedIds[]}) → reorders by array; returns reordered list.
- Consumes: `requireAuth`.

- [ ] TDD: create/rename/edit/delete/reorder + ownership.
- [ ] Implement (wordCount via extracting text nodes from JSON doc).

### Task 9: Front Matter API

**Files:**
- Create: `backend/src/routes/frontMatter.ts`
- Test: `backend/src/__tests__/frontMatter.test.ts`

**Interfaces:**
- Produces: `GET /api/novels/:novelId/front-matter`, `PUT /api/novels/:novelId/front-matter` ({content}). Auto-created on novel creation.
- Consumes: `requireAuth`.

- [ ] TDD get/put + ownership.
- [ ] Implement.

### Task 10: Frontend Foundation

**Files:**
- Create: `frontend/src/theme.css`, `frontend/src/components/ui/*` (Button, Input, Textarea, Select, Spinner, Skeleton, Modal, Toaster, DropdownMenu, ConfirmDialog), `frontend/src/api/client.ts`, `frontend/src/api/*.ts`, `frontend/src/hooks/useAuth.tsx`, `frontend/src/App.tsx` (router)
- Modify: `frontend/vite.config.ts`, `frontend/src/main.tsx`

**Interfaces:**
- Produces: `fetchJson<T>(path, opts)` with credentials + error normalization; `AuthProvider` + `useAuth()`; route table: `/`, `/login`, `/register`, `/dashboard`, `/novels/:id`.
- Consumes: backend API.

- [ ] Tailwind v4 theme tokens (ink/parchment/amber accent), serif + sans fonts via @fontsource.
- [ ] UI primitives + Toast context.
- [ ] API client + typed endpoint functions + AuthProvider.
- [ ] Router with protected routes (RequireAuth).
- [ ] Verify frontend boot + build.

### Task 11: Landing + Auth Pages

**Files:**
- Create: `frontend/src/pages/Landing.tsx`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: public landing (hero "Write. Create. Continue your story.", features, workspace preview mockup, auth CTAs), login/register with client + server validation errors and Google button (displays "not configured" state if backend says so).

- [ ] Implement landing.
- [ ] Implement login/register.

### Task 12: Dashboard

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`, `frontend/src/components/dashboard/NovelCard.tsx`, `frontend/src/components/dashboard/CreateNovelModal.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `GET /api/novels`, `POST /api/novels`, uploads.
- Produces: welcome + avatar menu, "Continue writing" (uses lastOpenedChapterId), recent list, cards with cover/genre/chapters·words/edited-ago, manage menu, create modal with cover upload + genre select.

- [ ] Implement with loading skeletons, empty state ("Your next story is waiting..."), error retry.
- [ ] Implement create modal.

### Task 13: TipTap Editor

**Files:**
- Create: `frontend/src/components/editor/TipTapEditor.tsx`, `frontend/src/components/editor/EditorToolbar.tsx`, `frontend/src/lib/editorExtensions.ts`

**Interfaces:**
- Produces: controlled-ish TipTap component (keys by doc identity), `onUpdate(docJson, text, words)`, toolbar actions, image insert JSON, word/char counts via CharacterCount.
- Consumes: tiptap packages; upload route for image insertion.

- [ ] Configure extensions (StarterKit, Underline, TextAlign, Link, Image with resize, Placeholder, CharacterCount).
- [ ] Toolbar (bold/italic/underline/h1/h2/blockquote/ol/ul/align/link/undo/redo/image).
- [ ] Word/char count + placeholder styling.

### Task 14: Novel Workspace

**Files:**
- Create: `frontend/src/pages/NovelWorkspace.tsx`, `frontend/src/components/workspace/ChapterSidebar.tsx`, `frontend/src/components/workspace/SaveIndicator.tsx`, `frontend/src/hooks/useSaveState.ts`, `frontend/src/components/workspace/NovelSettingsModal.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: header (logo/menu, novel title, SaveIndicator, avatar), sidebar: chapters (select, add, rename, delete w/ confirm, drag reorder via dnd-kit, front-matter entry, settings), editor pane, autosave (debounce 1.8s) + manual save, per-chapter load from `lastOpenedChapterId`.

- [ ] Implement save-state hook (`idle|saving|saved|dirty|error`) with retry.
- [ ] Implement sidebar + dnd reorder.
- [ ] Implement workspace wiring (load novel → chapters → open lastOpened; update progress on open).
- [ ] Mobile: sidebar becomes drawer/sheet.

### Task 15: Images in Chapters + Covers

**Files:**
- Modify: `frontend/src/components/editor/EditorToolbar.tsx`, dashboard/workspace modals

**Interfaces:**
- Produces: chapter image insert (upload → URL → `<img>`), cover set/change + live preview.

- [ ] Wire image upload + insert.
- [ ] Wire cover uploads in create + settings.

### Task 16: Polish

**Files:**
- Modify: theme, dashboards, workspace, auth pages

- [ ] Light/dark toggle (class strategy + persisted).
- [ ] Full empty/loading/error audit; skeleton pass.
- [ ] Responsive audit (desktop/tablet/mobile).
- [ ] Animations (hover, modal, card, save indicator pulse) — subtle; accessibility checks (focus, ARIA, contrast).

### Task 17: Verification

- [ ] Run `npm run test` backend (vitest) — all green.
- [ ] `npm run build` backend + frontend — no TS errors.
- [ ] Manual API E2E via PowerShell: register → login → create novel → create chapter → update content → reorder → front matter → upload cover/image → authorization check (User B blocked).
- [ ] Boot both servers; verify frontend serves; run acceptance journey §54 manually.
- [ ] Fix all bugs found; re-run.

### Task 18: Docs + Docker Files

**Files:**
- Create: `README.md`, `docs/ARCHITECTURE.md`, `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `.dockerignore`

- [ ] README: prerequisites, env setup, DB create, migrate, run backend/frontend, feature notes, Google OAuth config.
- [ ] ARCHITECTURE.md: data flow, auth flow, data model, storage, deployment topology.
- [ ] Dockerfiles + compose (compose explained in DEPLOYMENT_GUIDE).

### Task 19: DEPLOYMENT_GUIDE.md

**Files:**
- Create: `docs/DEPLOYMENT_GUIDE.md`

- [ ] Beginner step-by-step per spec §45–47: local verify → Git/GitHub → Docker → Docker Hub → Azure account/CLI/VM → Terraform → ACR → GitHub Actions → Kubernetes (VM self-host) → AKS → env/secrets → persistent storage → domain/HTTPS → Azure Monitor → logs → updates → rollbacks → troubleshooting → hardening. Every section: what/why/install/config/exact commands/expected output/verify/common errors. No placeholders; recommend one consistent production path.

---

## Self-Review Notes

- Spec §54 acceptance journey fully covered by Tasks 4,5,7,8,12,14,15 + Task 17 manual verification.
- Spec §52 (don't claim untested features): Google OAuth and Azure steps clearly marked credential/cloud-gated in README/guide.
- Authorization (spec §16): ownership enforced in task-level tests (novels/chapters/frontMatter/uploads).
- Docker requirements are real files + explained in DEPLOYMENT_GUIDE (§31).
- Storage abstraction (§42) satisfied by `StorageProvider` interface; guide explains Azure Blob swap.