# COR / Compliance — Proven Integration Plan

**Status:** Accepted for implementation planning (structure-first; official BCCSA question bank filled later)  
**Date:** 2026-07-19  
**Constraint:** Extend Proven only. No new app, no UI redesign, no branding changes. Reuse data; do not duplicate Learning or competency systems.

---

## Product framing

Proven becomes an integrated OH&S / COR readiness platform. The **Compliance** module orchestrates audit readiness from work already done in training, competencies, assessments, documents, and (new) HSMS ops.

**Do not confuse:**

| Product area | Meaning in Proven |
|--------------|-------------------|
| Learning / BCCSA crane materials | Tower crane rigger **education** (Pull consolidation) |
| COR / Compliance | Employer **Certificate of Recognition** HSMS audit readiness |

Keep nav labels, docs, and AI prompts distinct.

---

## Integration principles

1. **Evidence adapters, not copies** — Link `Assessment`, `ExamResult`, `Certificate`, `LessonProgress`, `Document`, etc. via polymorphic / typed evidence links.
2. **Company scope + soft delete** — Match existing Prisma/service patterns (`companyId`, `deletedAt`).
3. **Separate permission** — `"compliance"` ≠ `"learning"`.
4. **One hub, many sub-routes** — Avoid five new top-level nav items; use **Compliance** with children.
5. **Structure first** — Schema for Elements → Questions → Evidence → Audits → CAPA now; seed stub elements; load full BCCSA question bank when available.
6. **Auto readiness** — Recalculate when source events occur (hooks from existing feature actions).

---

## 1. Existing tables to reuse (evidence sources)

| Existing model | COR use |
|----------------|---------|
| `CurriculumEnrolment` / `LessonProgress` | Training completion evidence |
| `WrittenExam` / `ExamResult` | Knowledge / orientation |
| `Assessment` / `AssessmentResult` / `AssessmentSignature` | Practical competency |
| `Observation` | Leading indicator only (near-miss / unsafe)—**not** full incidents |
| `Certificate` | Tickets / expiry |
| `TrainingMatrix` / `TrainingMatrixEntry` | Gap analysis |
| `EquipmentQualification` | Equipment competency |
| `ExperienceLogEntry` / `EmployeeHour` | Hours / apprenticeship |
| `Document` / `Photo` / `Video` | File attachments (extend `MediaEntityType`) |
| `Employee` / `Project` / `Company` | Scope, interviews, ownership |
| `Competency` (+ standards refs) | Map questions → skills library |
| `Notification` / `AuditLog` | Alerts + platform trail (≠ incident investigation) |

**Demonstrations** = UX over `Assessment` (`demonstrations.service.ts`) — reuse, don’t fork.

---

## 2. Gaps (must add; COR expects them)

| Gap | Approach |
|-----|----------|
| Incidents / investigations | New HSMS models (do not overload `Observation`) |
| Inspections | New models; optional link to `Equipment` / `Project` |
| Toolbox talks / meetings | New models + attendance |
| Formal CAPA | New `CorrectiveAction` (Observation follow-up is too thin) |
| Policy / SWP acknowledgement | Thin layer over `Document` + acknowledgement rows |
| COR audit scoring / auditor portal | Native Compliance models + invite scoped role |

---

## 3. Components / patterns to extend (not redesign)

| Concern | Reuse |
|---------|--------|
| Page chrome | `PageHeader`, `StatCard`, `EmptyState` |
| Tables | `DataTableShell` (admin) or existing list patterns in features |
| Dashboard tiles/charts | `features/dashboard/*`, `features/analytics/*` |
| PDF / Excel | `lib/pdf/*`, `reports` hub, training-matrix / analytics export APIs |
| Media upload | Copy observation/assessment action + storage buckets |
| Auth / tenancy | `requirePermission`, `requireCompanyId`, `canWrite` |
| Shell / nav | `NAV_ITEMS`, `ROUTE_PERMISSIONS`, `sidebar-nav` icons |

---

## 4. Navigation & permissions

**Permission:** `"compliance"`

**Roles (v1):** SUPER_ADMIN, COMPANY_ADMIN, SUPERVISOR, INSTRUCTOR (mutate carefully); ASSESSOR / OPERATOR / READ_ONLY: read as needed; external auditor: separate limited invite path later.

**Nav (top-level):**

```
Compliance → /compliance
```

**Sub-routes (same sidebar section or in-page tabs):**

| Label | Path |
|-------|------|
| COR Dashboard | `/compliance` |
| Internal Audits | `/compliance/audits` |
| External Audits | `/compliance/audits/external` |
| Audit History | `/compliance/audits/history` |
| Corrective Actions | `/compliance/corrective-actions` |
| Evidence Library | `/compliance/evidence` |
| Reports | `/compliance/reports` (extends report types; may deep-link existing `/reports`) |

Update: `src/lib/auth/permissions.ts`, `src/lib/constants.ts`, `src/components/layout/sidebar-nav.tsx`.

---

## 5. APIs / services to reuse

| Need | Existing |
|------|----------|
| Worker / training evidence | `people`, `training-matrix`, `assessments`, `exams`, `learning`, `certifications` |
| Safety soft signals | `observations` (typed filters) |
| Exports | `/api/reports/generate`, training-matrix export, analytics export |
| Dashboard | Extend carefully via `dashboard.service` **or** dedicated compliance dashboard only |

**New:** `src/services/compliance.service.ts`, `src/services/cor-readiness.service.ts`, `src/features/compliance/*`.

No mock APIs; follow `ServiceResult` + company scoping.

---

## 6. New schema (additive only)

### COR structure (BCCSA-shaped; stub bank first)

| Model | Key relationships |
|-------|-------------------|
| `CorProgram` | `companyId` → Company (or platform template with `companyId` null) |
| `CorElement` | `programId`; code/title/sortOrder |
| `CorQuestion` | `elementId`; number, reference, description, weight, doc/obs/interview flags |
| `CorAuditSession` | `companyId`, `programId`; type INTERNAL/EXTERNAL; status DRAFT→COMPLETE |
| `CorQuestionResponse` | `sessionId`, `questionId`; status, score, comments, AI confidence |
| `CorInterview` | `sessionId`, `questionId?`, `employeeId?` |
| `CorObservationNote` | `sessionId`, `questionId?` (audit field note; ≠ `Observation` model) |
| `CorEvidenceRequirement` | `questionId`; type DOCUMENTATION / OBSERVATION / INTERVIEW |
| `CorEvidenceLink` | `questionId` and/or `responseId`; `sourceType` + `sourceId` → existing Proven records |
| `CorScoreRollup` | `sessionId`, `elementId`; computed scores |

### HSMS (feeds readiness)

| Model | Key FKs |
|-------|---------|
| `Incident` | company, project?, reporter/subject employees |
| `IncidentInvestigation` | incident, investigator |
| `Inspection` | company, project?, equipment?, inspector |
| `InspectionItem` | inspection |
| `ToolboxTalk` | company, project?, presenter |
| `ToolboxTalkAttendee` | talk, employee |
| `CorrectiveAction` | company; links to audit question response / incident / inspection / observation; owner, due, priority, status |
| `CorrectiveActionEvent` | activity log |
| `PolicyDocument` | company, optional Document |
| `PolicyAcknowledgement` | policy, employee |
| `ExternalAuditorInvite` | company, audit session, email/token, expiry |

Extend `MediaEntityType`: `INCIDENT`, `INSPECTION`, `TOOLBOX_TALK`, `CORRECTIVE_ACTION`, `COR_AUDIT`, `COR_EVIDENCE`.

### Evidence source enum (examples)

`ASSESSMENT_RESULT`, `EXAM_RESULT`, `CERTIFICATE`, `LESSON_PROGRESS`, `TRAINING_MATRIX_ENTRY`, `DOCUMENT`, `OBSERVATION`, `EQUIPMENT_QUALIFICATION`, `EXPERIENCE_LOG`, `INSPECTION`, `INCIDENT`, `TOOLBOX_TALK`, `POLICY_ACK`

---

## 7. COR Readiness Engine

**Service:** `cor-readiness.service.ts`

**Inputs:** Evidence links + CAPA status + question requirements + expiry windows (certs, policies).

**Outputs:** Overall readiness %, predicted audit score, element scores, outstanding evidence, open CAPAs, upcoming reviews.

**Triggers (event hooks in existing actions — no batch sync UI):**

- Document uploaded / training completed / competency signed / exam passed  
- Inspection completed / CAPA closed / toolbox talk completed / incident investigated  

**Implementation note:** Start with **on-write recalculation** for affected `companyId` (debounced). Add queued jobs later if needed. Never manual “Sync COR” as the primary path.

---

## 8. Audit Mode & External portal

| Mode | Behavior |
|------|----------|
| Internal | Full CRUD on draft sessions; interviews; observations; evidence attach; CAPA assign; resume drafts |
| External | Invite-only, session-scoped read + findings/comments/requests; no unrelated people/HR/financial data |

External access: dedicated token/auth path; RLS / service checks by `auditSessionId` + invite.

---

## 9. AI Assistant (later phase)

Register Compliance tools/prompts that query readiness + CAPA + evidence gaps. Do not invent data — call readiness/compliance services.

---

## 10. Reporting

Extend `src/lib/validations/report.ts` + PDF builders:

- Audit report, executive summary, element report, CAPA report, evidence pack, trends, management review  

Reuse Excel/CSV patterns from analytics / training-matrix exports.

---

## 11. Refactoring to avoid duplication

| Risk | Mitigation |
|------|------------|
| Second LMS | Link Learning progress only |
| Observation → Incident | New `Incident`; optional FK from Observation |
| Fat dashboard | Compliance metrics on `/compliance` first |
| Media orphans | New entity types + buckets; same upload pattern |
| Pull migration conflict | Additive migrations only; don’t alter Learning tables for COR |

---

## 12. Phased implementation

| Phase | Deliverable | Test focus |
|-------|-------------|------------|
| **0** | This plan + element stub list; map Element codes → existing evidence types | Document only |
| **1** | Prisma models + migration; seed stub elements/questions | `db push` / migrate; RLS if used; company isolation tests |
| **2** | Evidence link APIs + readiness calculator (read-only dashboard) | Unit tests for scoring; fixture company |
| **3** | Compliance hub UI (dashboard, evidence library, question browser) | Permission gates; visual consistency with Proven |
| **4** | Internal Audit Mode (sessions, responses, drafts) | Resume draft; soft delete |
| **5** | CAPA + notifications | Auto-create on fail; due/overdue |
| **6** | HSMS ops: Inspections → Toolbox → Incidents (order by operational value) | CRUD + media + company scope |
| **7** | Reports PDF/Excel | Snapshot fixtures |
| **8** | External auditor portal | Invite expiry; data scoping |
| **9** | AI tools + full BCCSA question bank import | Prompt regression; import idempotency |

---

## 13. Testing strategy

- **Unit:** readiness scoring, evidence matching rules, CAPA generation  
- **Integration:** service + Prisma company isolation  
- **E2E (smoke):** create internal audit → attach existing certificate as evidence → fail question → CAPA created → readiness drops/rises  
- **Permissions:** worker cannot open other company’s audit; external invite cannot list `/people`  
- **Non-regression:** Learning slides / Pull fidelity unchanged; existing assessment/observation flows green  

---

## 14. Open decisions (resolved / pending)

| Decision | Status |
|----------|--------|
| Question bank | **Resolved:** structure first; stub seed; full BCCSA bank later |
| Observation vs Incident | **Resolved:** separate Incident model |
| Nav depth | **Resolved:** single Compliance top-level + sub-routes |
| AI / external portal | Phase 8–9 after core audit + evidence |

---

## Bottom line

Compliance is an **orchestration + HSMS** layer. Proven already holds most **training/competency evidence**. Ship schema + readiness + internal audits first; add HSMS records that don’t exist yet; keep Learning and COR product lines cleanly separated.
