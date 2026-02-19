# 09 – Scope and implementation rules

This document is the single source for "what every PR must deliver" and "what must pass in acceptance." Refactor incrementally; do not rewrite.

---

## Scope (must)

### A) RBAC simple (no permission sets)

- **Roles:** Admin, Manager, Sales, Support, ReadOnly.
- **Enforce at:** Controller/service level and UI route guards.
- **Policies:**
  - **Admin** => full access.
  - **Manager** => CRUD on own + team's records; read all dashboards.
  - **Sales** => CRUD on own Leads/Contacts/Accounts/Opportunities/Activities; read-only others via sharing rules.
  - **Support** => CRUD Cases and related Activities; read Accounts/Contacts; no Opportunity edits.
  - **ReadOnly** => read across core objects, no write.

### B) UX upgrades (Kommo/GoHighLevel style)

- **Home by role:** Sales (pipeline + tasks), Manager (team pipeline + forecast), Support (queues), ReadOnly (dashboards).
- **Opportunities Kanban** with stages: [Prospecting, Qualification, Proposal, Negotiation, Won, Lost].
- **Cases Queue view** with bulk assign/reassign/close; SLA placeholders.
- **Record pages** with tabs: Details, Activities, Related, Timeline.
- **Saved views:** "Mis registros", "Mi equipo", "Todos".
- **Quick actions:** change stage, assign owner/queue, create task.

### C) Integrations (stubs, clean contracts)

- `POST /api/integrations/meta/webhook` → create Lead with source='Meta'; verify signature placeholder.
- `POST /api/integrations/google/offline-conversion` → accept `{ gclid|wbraid, timestamp, value, currency }`, enqueue job; adapter interface.
- `POST /api/integrations/whatsapp/webhook` + `POST /api/integrations/whatsapp/send` → persist Message, link to Contact/Case; provider adapter.
- Place all adapters under `/integrations/*` (routes + lib), with DTOs, retry/backoff, and DLQ table.

### D) Reporting/Dashboards (server-side)

- Aggregates endpoints per role: pipeline by stage, tasks due, team metrics, cases by status/priority.
- Add necessary indexes; avoid N+1 queries. Provide caching policy if needed.

### E) Admin Console (MVP)

- **Users:** CRUD, activate/deactivate, set role, set team.
- **Teams & Queues:** CRUD; assign manager to Team; Cases bind to Queues.
- **Field settings (MVP):** mark required and picklist values in config table; reflect on UI forms.
- **Audit logs:** list with filters by user/action/date.

### F) Non-functional

- **Tests:** auth/RBAC, lead conversion, opportunities Kanban queries, case queue assign, integrations stubs.
- **Seeds:** demo org with one user per role, sample pipeline, sample cases, demo campaigns and messages.
- **Docs:** Swagger up to date; Postman collection; README sections updated.
- **Telemetry:** structured logs with correlation_id; consistent error format `{ error_code, message, details?, correlation_id }`.
- **Feature flags** for risky changes.

---

## Constraints

- Refactor, don't rewrite. Avoid large diffs. One topic per PR.
- If DB migrations are required, write reversible migrations and a data backfill script. Provide rollback notes in the PR description.
- Keep **Spanish labels in UI**; **code comments in English**.

---

## Deliverables per PR

- Code + unit/integration tests
- Migration (if any) + seeds (if applicable)
- Updated docs (Swagger, README)
- Postman requests for new endpoints
- "How to validate" steps and screenshots/gifs where applicable

---

## Acceptance checks (must pass)

- Each role's CRUD conforms to RBAC.
- **Sales flow:** create lead → convert → opportunity in Kanban; quick actions work.
- **Support flow:** case intake → assign queue → assign agent → close; audit trail.
- **Integrations:** endpoints accept payloads, validate, persist; queue jobs created; no unhandled exceptions.
- **Dashboards:** render aggregates from seeded data.
