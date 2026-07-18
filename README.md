# Proven

Competency Management System (CMS) for the construction industry.

Proven manages and verifies practical competencies, written exams, apprenticeship progress, instructor observations, certifications, and continuous assessments.

This is **not** a Learning Management System.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Postgres)
- Prisma
- React Hook Form + Zod
- TanStack Query

## Getting started

```bash
# Use Node 22+
nvm use

cp .env.example .env.local
# Fill in DATABASE_URL and Supabase keys

npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/           # Next.js App Router (auth + dashboard route groups)
  components/    # Shared UI (layout, theme, shadcn primitives)
  features/      # Domain feature modules
  hooks/         # Shared React hooks
  lib/           # Prisma, Supabase, env, validations, constants
  services/      # Server-side data access (Prisma)
  types/         # Shared TypeScript types
  utils/         # Pure helpers (formatting, etc.)
prisma/          # Schema and migrations
```

## Environment

See `.env.example` for required variables:

- `DATABASE_URL` — Supabase Postgres connection string
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `PROVEN_DEFAULT_ORG_ID` — organization scope until session wiring is complete

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:studio` | Open Prisma Studio |
