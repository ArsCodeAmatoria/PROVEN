# Pull → Proven consolidation migration (safe)

**Policy:** Inspect → migrate/upsert → verify → only then deprecate. No dropped tables in this phase.

## Goals

- Preserve user accounts (`users` / auth)
- Preserve lesson content (JSON + images remain source of truth for slides)
- Preserve / introduce curriculum progress (`lesson_progress`, enrolments)
- Preserve competency links and assessment history
- Single source of truth under Proven Prisma models

## Phase 0 — Inventory (read-only)

Run against the shared Supabase project (session pooler / `DIRECT_URL` for long queries):

```sql
-- Example inventory (adjust names if historic Pull tables differ)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY 1;
```

Record counts for: users, employees, curricula, curriculum_lessons, lesson_progress, assessments, written exam attempts, competencies.

## Phase 1 — Catalog sync (non-destructive)

Proven `ensureRiggerCompetencyCurriculum(companyId)` upserts:

| Proven | Source |
|--------|--------|
| `curricula` code `TOWER-CRANE-RIGGER` | Product curriculum shell |
| `curriculum_modules` code `RIGGER-COMPETENCY` | Pull track `rigger-competency` |
| `curriculum_lessons.content_key` | `rigger-competency:{unitId}` from slide JSON units |

No deletes. Soft-deleted rows are revived (`deleted_at = null`) on upsert.

## Phase 2 — Progress / users

If historic Pull progress tables exist:

1. Export CSV/SQL snapshot
2. Map Pull learner → `employees.id` via auth email / `auth_user_id`
3. Map Pull lesson key → `content_key`
4. Insert into `lesson_progress` with `ON CONFLICT DO UPDATE` only when newer
5. Never overwrite `COMPLETED` with `NOT_STARTED`

## Phase 3 — Cutover checklist

- [ ] `/slides/present` pixel-matches Pull for cover, focus, quiz, charts
- [ ] Learning hub shows Completed / In Progress / Not Started
- [ ] Enrolment auto-created for signed-in workers
- [ ] Written exams remain on Knowledge (`/exams`) — practice-test framing retired in UX copy later
- [ ] Health endpoint green (`database`, `supabase`, `serviceRole`)
- [ ] Proven-only login used for UAT

## Phase 4 — Decommission (future)

Only after Phase 3 sign-off:

1. Redirect Pull host → Proven
2. Archive Pull repo / freeze deploy
3. Drop **empty** Pull-only tables if any remain after merge verification
4. Keep all shared competency/assessment history intact

## Rollback

Slide content is file-based under `src/features/learning/`; revert app deploy restores prior UI. Curriculum upserts are additive. Restore DB from Supabase PITR if a future destructive migration misfires — **do not** run destructive SQL in Phase 0–3.
