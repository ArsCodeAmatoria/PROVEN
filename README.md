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

## Authentication

Supabase Auth with company-scoped profiles and RBAC:

| Role | Access |
|------|--------|
| Super Admin | Full platform |
| Company Admin | Company management + all modules |
| Instructor | Assessments, exams, observations, apprenticeships |
| Supervisor | Progress oversight + observations |
| Apprentice | Own progress, assessments, exams, certifications |
| Operator | Operational entry on competencies/assessments |
| Read Only | View-only across modules |

Protected routes are enforced in middleware (session + role) and again in server layouts/pages. Session cookies persist when **Remember me** is enabled (30 days).

## Database

Complete PostgreSQL schema (Prisma + SQL):

- `prisma/schema.prisma` — application models
- `supabase/migrations/20260718010000_complete_schema.sql` — DDL (enums, tables, FKs, indexes, updated_at triggers)
- `supabase/migrations/20260718010001_auth_user_triggers.sql` — auth.users → users/employees sync

Core entities: companies, users, employees, projects, competencies (+ categories), assessments (+ results), observations, written exams (+ questions/results), certificates, employee hours, equipment (+ types), photos/videos/documents, training matrix, notifications, audit logs.

Every table includes: `id` (UUID), `created_at`, `updated_at`, `created_by`, `deleted_at` (soft delete).

```bash
npm run db:push
# Then apply SQL migrations in Supabase (schema + auth triggers + prior RLS as needed)
```


Auth routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/callback`  
Account routes: `/profile`, `/settings`

## Environment

See `.env.example` for required variables:

- `DATABASE_URL` — Supabase Postgres connection string
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; company signup / admin APIs)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:studio` | Open Prisma Studio |
