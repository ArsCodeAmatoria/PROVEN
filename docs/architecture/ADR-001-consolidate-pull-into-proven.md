# ADR 001 — Consolidate Pull into Proven

## Status

Accepted — in progress (Learning core first)

## Context

Pull and Proven previously shared a Supabase project but were separate Next.js apps. Product direction is a **single SaaS platform: Proven**, covering learning, written knowledge tests, practical competency, reporting, and workforce management.

Pull’s classroom **lesson slide deck is approved and finished**. Visual and interaction fidelity of the viewer is a hard requirement.

## Decision

1. **Single product surface:** New work ships in Proven only. Pull is no longer the destination product; decommission of the Pull deployment comes after data and content parity are verified.
2. **Lesson viewer fidelity lock:** Migrate Pull’s slide JSON, images, CSS, fonts (Orbitron/Michroma), and `CompetencySlideDeck` into `src/features/learning/` **without redesign**. Host under `/slides/*` in a chrome-free `(slides)` layout so presenter/cast remains fullscreen.
3. **Curriculum catalog in Postgres:** Map slide units to `Curriculum` → `CurriculumModule` → `CurriculumLesson` (`contentKey` = `rigger-competency:{unitId}`). Progress lives in `LessonProgress` / enrolments. Knowledge completion stays separate from practical competency sign-off.
4. **Proven-only product gate:** `employees.app_access` / `AppAccess` enum removed (migration `20260719120000_remove_app_access.sql`). Learning curriculum tables remain — they are Proven Learning, not a separate Pull product.
5. **Auth:** Proven Supabase auth + existing role model; add `learning` permission for the Learning module.

## Consequences

- Learners open slides from Proven Learning; experience matches Pull.
- Proven theme (oklch) stays global; Pull tokens are **scoped** under `.learning-slides-root`.
- Later work: Knowledge exams as official module exams, worker passport tabs, admin curriculum tools, and safe archival of any remaining Pull-only artifacts.

## Migration notes (non-destructive)

See `docs/architecture/pull-consolidation-migration.md`.
