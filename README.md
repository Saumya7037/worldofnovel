# WorldofNovel

**Your personal digital novel-writing studio.**

WorldofNovel is a full-stack web application for writing, organizing, and resuming novels. It
combines a calm, elegant writing surface with reliable cloud storage, so your stories are always
one click away from where you left them.

## Features

- **Rich writing editor** — TipTap-powered editing with headings, bold/italic/underline,
  blockquotes, lists, horizontal rules, text alignment, links, inline images and smart typography.
- **Autosave** — every change is instantly saved to PostgreSQL. Refresh, log out, or leave for a
  week; your words are waiting.
- **Resume writing** — each novel remembers the last chapter you opened. The dashboard picks it
  right back up.
- **Novel library** — covers, genres, descriptions, author bylines, and live word counts on every
  card.
- **Chapters & front matter** — create, rename, reorder (click-and-drag) and delete chapters;
  dedicate the book with a front-matter page.
- **Images** — upload covers and inline chapter images; files are stored on disk now,
  swappable to Azure Blob Storage later through a small storage interface.
- **Authentication** — email/password (with JWT in a secure httpOnly cookie) plus optional
  Google OAuth sign-in.
- **Security** — passwords hashed with bcrypt, resource-ownership checks, validation, and
  rate-limit-friendly error semantics.
- **A workspace that respects you** — light/dark mode, serif-centred typography (Newsreader,
  Lora), and a calm "ink & parchment" theme.

## Tech stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS 4, TipTap 3, TanStack Query, React Router, dnd-kit |
| Backend    | Node.js, Express, TypeScript, Prisma ORM, zod                      |
| Database   | PostgreSQL 18                                                      |
| Auth       | JWT (httpOnly cookie) + bcrypt, Google OAuth (authorization code)  |
| Storage    | Local filesystem via `StorageProvider` interface (Azure-ready)     |
| Testing    | Vitest + Supertest (backend), 39 unit/integration tests            |
| Deployment | Guide only — see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)      |

## Prerequisites

- Node.js 20+ (tested on 22.x)
- PostgreSQL 15+ (local install)
- npm 10+

## Quick start — local development

### 1. Database

Run PostgreSQL locally, then create the database
(adjust credentials to match your local Postgres):

```bash
psql -U postgres -c "CREATE DATABASE worldofnovel;"
```

> Your PostgreSQL password belongs in `backend/.env`, not in this file. No `.env`
> file is committed.

### 2. Backend

```bash
cd backend
cp ../.env.example .env        # then edit DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma migrate dev         # creates the schema
npm run dev                    # → http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                    # → http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend, so everything just works.

Health check: <http://localhost:4000/api/health>

## Deployment

There are **no deployment artifacts** (Dockerfiles, compose files, CI YAML, k8s
manifests) in this repository. Everything needed to build, containerize, and deploy
WorldofNovel is written out step-by-step in
[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — copy the snippets from the guide when
you are ready to deploy.

## Google OAuth (optional)

1. Create OAuth credentials at Google Cloud Console.
2. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `backend/.env`.
3. Restart the backend. The login button becomes active and the health endpoint reports
   `googleConfigured: true`.

Without credentials the app runs fully with email/password accounts.

## Scripts

| Where    | Command            | Purpose                                |
| -------- | ------------------ | --------------------------------------- |
| backend  | `npm run dev`      | Start API in watch mode                 |
| backend  | `npm run build`    | Type-check + compile to `dist/`         |
| backend  | `npm start`        | Run the compiled server                 |
| backend  | `npm test`         | Run the Vitest suite (39 tests)         |
| backend  | `npm run db:studio`| Open Prisma Studio                      |
| frontend | `npm run dev`      | Vite dev server (port 5173)             |
| frontend | `npm run build`    | Type-check + production bundle          |
| frontend | `npm run lint`     | oxlint                                  |

## Project layout

```
backend/    Express + Prisma API server
  prisma/   schema + migrations
  src/      routes, services, middleware, tests
  uploads/  locally stored cover & chapter images
frontend/   React + Vite + Tailwind + TipTap app
  src/      pages, components, api client, hooks, lib
docs/       implementation notes (superpowers plan)
docker-compose.yml   runs db + backend + frontend
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive, and
[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for putting it online.

## License

Private project.