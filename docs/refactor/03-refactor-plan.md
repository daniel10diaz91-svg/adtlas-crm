# 03 – Refactor plan

**Reference:** Scope, constraints, deliverables per PR, and acceptance checks are in [09-scope-and-implementation-rules.md](09-scope-and-implementation-rules.md). Each PR must include tests, migration+seeds if applicable, updated Swagger/README, Postman for new endpoints, and "How to validate" steps (screenshots/gifs where applicable).

## Work breakdown (1–2 day tasks, small PRs)

### Phase 1: RBAC foundation (Days 1–3)

| Task | Scope | Acceptance criteria | Test notes | Backout |
|------|--------|---------------------|------------|---------|
| **1.1** Migrate roles in DB | Add enum values `manager`, `sales`, `support`, `readonly`; keep `admin`, `ventas`; map `ventas` → `sales` in migration | Schema has 6 roles; existing users still valid | Run migration on branch; verify login | Revert migration (remove new values; keep ventas) |
| **1.2** Session + types | `lib/session.ts`: extend role type; map `ventas` → `sales` in session if desired for gradual rename | No runtime error; existing sessions work | Login as admin/ventas | Revert commit |
| **1.3** Permissions matrix | `lib/permissions.ts` + optional `lib/rbac-matrix.ts`: implement matrix from 04-rbac-target; keep `canUpdateLead`, `canDeleteLead`, etc., delegating to matrix | Manager can see team; sales own; readonly read-only | Unit/API tests per role | Feature flag; revert to old checks |
| **1.4** Route guards | Middleware or API helpers: restrict by role (e.g. admin-only routes for `/api/users` POST, admin/manager for assignment) | 403 for disallowed role | Call APIs as each role | Revert guard layer |
| **1.5** Tests – auth/RBAC | Unit/integration tests: login per role, CRUD checks per role (see 09 acceptance) | All role CRUD conforms to RBAC | Run test suite | Revert tests |

### Phase 2: Admin console (Days 4–5)

| Task | Scope | Acceptance criteria | Test notes | Backout |
|------|--------|---------------------|------------|---------|
| **2.1** User CRUD API | POST/PATCH/DELETE `/api/users` (admin only); invite or create with role | Admin creates manager/sales; cannot set admin | Postman/playwright | Revert route |
| **2.2** Team entity (optional) | Tables `teams`, `user_teams`; API list/assign; used for “manager sees team” | Manager filter uses team membership | Integration test | Revert migration + code |
| **2.3** Admin UI – Users | Page `/dashboard/admin/usuarios`: list users, create (email, role), deactivate | Admin sees list and can add user | E2E smoke | Hide nav link; revert page |
| **2.4** Queues + field settings | Tables `case_queues`, `field_settings`; admin API and minimal UI (list queues; required/picklist per entity) | Queues and settings stored and readable | API tests | Revert migrations |
| **2.5** Teams: assign manager | Teams CRUD; assign manager to Team; Cases bind to Queues (see 09 Admin Console) | Manager sees team; Cases have queue_id | Integration test | Revert |

### Phase 3: UX upgrade (Days 6–9)

| Task | Scope | Acceptance criteria | Test notes | Backout |
|------|--------|---------------------|------------|---------|
| **3.1** Home by role | Dashboard home by role: Sales (pipeline + tasks), Manager (team pipeline + forecast), Support (queues), ReadOnly (dashboards) – see 09 UX | Correct data per role | Manual per role | Revert to single home |
| **3.2** Saved views | Backend: filter presets (e.g. “Mis registros”, “Mi equipo”, “Todos”); API or query params; frontend selector on leads list | User can switch view and see correct list | E2E filter switch | Remove selector; keep default view |
| **3.3** Record detail page | `/dashboard/leads/[id]`: tabs Details / Activities / Related / Timeline; reuse existing PATCH lead | No URL change for list; new detail URL | Navigation from list to detail | Revert detail page |
| **3.4** Quick actions | Component: “Create task”, “Change stage”, “Assign” (where permitted); use on list row and detail | Actions call existing APIs; respect RBAC | Click actions as sales/admin | Remove component |
| **3.5** Cases + queue | Tables `cases`, `case_queues`; API; queue view `/dashboard/cases` with bulk assign/reassign/close; SLA placeholders (see 09) | Support flow: intake → assign queue → assign agent → close; audit trail | E2E cases flow | Revert cases feature |
| **3.6** Seed default pipeline stages | Optional seed/migration: stages [Prospecting, Qualification, Proposal, Negotiation, Won, Lost] for Opportunities Kanban (09 UX) | New tenants get standard stages | Seed run | Revert seed |

### Phase 4: Integrations (Days 10–11)

| Task | Scope | Acceptance criteria | Test notes | Backout |
|------|--------|---------------------|------------|---------|
| **4.1** Meta webhook under /integrations | Move/alias to `POST /api/integrations/meta/webhook`; create Lead with source='Meta'; adapter + signature verification placeholder (09 C) | Payload accepted, validated, persisted; 401 on invalid sig when enabled | Integration stub test | Revert; keep legacy route during transition |
| **4.2** Google Ads offline | `POST /api/integrations/google/offline-conversion`; body `{ gclid\|wbraid, timestamp, value, currency }`; enqueue job; adapter interface (09 C) | 200; job enqueued; no unhandled exceptions | Postman + stub test | Disable route |
| **4.3** WhatsApp webhook + send | `POST /api/integrations/whatsapp/webhook` + `POST /api/integrations/whatsapp/send`; persist Message, link to Contact/Case; provider adapter (09 C) | Health 200; webhook logs and returns ok | Manual + stub test | Feature flag off |

### Phase 5: Reporting + supportability (Days 12–14)

| Task | Scope | Acceptance criteria | Test notes | Backout |
|------|--------|---------------------|------------|---------|
| **5.1** Aggregations API | `GET /api/dashboard/metrics?role=...` (or derived from session); cache headers | Role-specific counts returned | Assert cache + correctness | Revert endpoint |
| **5.2** Indexes + cache | Add indexes for dashboard queries; optional Redis or in-memory TTL for metrics | No regression on lead list load | Load test | Revert migration / cache |
| **5.3** Docs + playbook | Swagger/OpenAPI, Postman collection, logging (correlation_id), error format, admin playbook (08-supportability) | Docs deploy with app | Review | Docs only |
| **5.4** Audit log | Table + write on sensitive mutations (user create, lead assign, etc.); admin-only read API; list with filters user/action/date (09 E) | Events stored and visible in admin | Insert then list | Revert writes; keep table optional |
| **5.5** Seeds – demo org | Demo org: one user per role, sample pipeline, sample cases, demo campaigns/messages (09 F) | Dashboards render aggregates from seeded data | Run seed; open dashboard | Revert seed script |
| **5.6** Tests – flows + stubs | Lead conversion, opportunities Kanban queries, case queue assign, integration stubs (09 F, acceptance) | Sales flow + Support flow + Integrations acceptance pass | Full test run | Revert tests |

---

## Deliverables per PR (see 09)

- Code + unit/integration tests; migration (if any) + seeds (if applicable); updated Swagger/README; Postman for new endpoints; "How to validate" + screenshots/gifs where applicable. Reversible migrations and rollback notes in PR description.

---

## Acceptance checks (see 09)

- Each role CRUD conforms to RBAC. Sales flow: create lead → convert → opportunity in Kanban; quick actions work. Support flow: case → queue → assign → close; audit trail. Integrations: accept, validate, persist; queue jobs; no unhandled exceptions. Dashboards render aggregates from seeded data.

---

## Rollout strategy

- **Feature flags / env toggles:** New RBAC matrix behind `NEXT_PUBLIC_USE_NEW_RBAC` or `USE_NEW_RBAC`; new integrations behind `META_VERIFY_SIGNATURE`, `GOOGLE_ADS_OFFLINE_ENABLED`, `WHATSAPP_WEBHOOK_ENABLED`.
- **Canary:** Enable new RBAC for one tenant (e.g. by tenant_id in env); then full rollout.
- **URLs:** No breaking changes; new screens under existing `/dashboard` tree.

---

## Backout plan per task

- Each task above has a one-line backout (revert migration, revert commit, feature flag off, or hide UI). For DB migrations, keep a “down” migration script (e.g. remove new enum values or drop new tables) so we can revert without data loss for existing features.

---

## 2-week delivery roadmap (sprints)

- **Week 1 (Sprint 1):** Phase 1 (RBAC) + Phase 2 (Admin console – users + queues/field settings). Milestone: Admin can create users with roles; manager/sales/readonly behave per matrix.
- **Week 2 (Sprint 2):** Phase 3 (UX: Home by role, saved views, record detail, quick actions, cases queue) + Phase 4 (integrations stubs/adapters) + Phase 5 (reporting API, indexes, docs, audit log). Milestone: UX aligned with Kommo/GHL-like flows; integrations prepared; supportability docs and playbook in place.
