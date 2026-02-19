# 02 – Gap analysis

## 1. Delta vs target model

### RBAC

- **Current:** admin, ventas; permissions in `lib/permissions.ts` (lead/task ownership + assignment).
- **Target:** Admin, Manager, Sales Executive, Support, ReadOnly. No permission sets; simple role-based CRUD matrix.
- **Gap:** Add 3 roles; extend `users.role` enum; add “manager sees team” (requires team membership); “sales edits own”; “support” access to cases/queues; “readonly” read-only routes. Centralize matrix (see `04-rbac-target.md`).

### UX

- **Current:** Single Home; Kanban for pipeline; no cases queue; no record detail tabs; no saved views; no quick actions bar.
- **Target:** Home by role; Kanban for opportunities; Cases queue; record page with Details/Activities/Related/Timeline; saved views (“Mis registros”, “Mi equipo”, “Todos”); quick actions (create task, change stage, assign).
- **Gap:** Role-based dashboard variants; Cases entity + queue UI; record detail route + tabs; saved views (backend filter presets + frontend selector); quick actions component reusable across list/detail.

### Data model

- **Current:** tenants, users, pipeline_stages, lead_sources, leads, deals, tasks. No teams, no cases, no queues, no field_settings, no audit_log.
- **Target:** Minimal additions: teams (optional), cases + case_queues, field_settings (required/picklists), audit_log. Preserve existing tables and URLs.
- **Gap:** New tables only where strictly needed; reversible migrations; no breaking renames.

### Dashboards

- **Current:** One dashboard home with aggregates (counts, chart); filtered by role only for “who sees which leads”.
- **Target:** Server-side aggregates per role (e.g. Manager: team KPIs; Sales: my KPIs; Support: queue stats).
- **Gap:** API endpoint(s) for dashboard metrics by role; optional cache policy; indexes for aggregate queries.

### Integrations

- **Current:** Meta Lead Ads webhook only; no verification, no DLQ.
- **Target:** Meta (keep + verify), Google Ads offline conversions, WhatsApp (webhooks + outbound adapter). Adapters, DTOs, signature verification placeholders, retry/DLQ, healthchecks.
- **Gap:** Adapter layer; new webhook routes; env toggles; healthcheck endpoint.

### Admin console

- **Target:** Users, teams, queues, basic field settings (required/picklists), audit logs.
- **Current:** No user CRUD UI, no teams, no queues, no field settings, no audit log.
- **Gap:** New admin pages and APIs; reuse existing auth and tenant scoping.

---

## 2. Risk areas

| Area | Risk | Mitigation |
|------|------|------------|
| **Data migrations** | Adding roles/columns/tables can break RLS or app if not backward compatible | Reversible migrations; default new columns; deploy app that supports old + new role values |
| **Auth** | Changing role enum or session shape can log users out or break middleware | Add new roles as allowed values; keep existing roles; session remains backward compatible |
| **Permissions** | New roles without full matrix can grant over/under access | Single source of truth (04-rbac-target); feature flag for new RBAC until validated |
| **URLs** | Changing routes breaks bookmarks and links | Preserve `/dashboard`, `/dashboard/leads`, `/dashboard/pipeline`, etc.; add new paths only (e.g. `/dashboard/cases`, `/dashboard/admin/...`) |
| **Performance** | Dashboard aggregates and “team” queries can be heavy | Indexes (tenant_id, assigned_to_user_id, team_id, created_at); optional short TTL cache for dashboard API |
| **Integrations** | New webhooks can receive unexpected payloads; signature verification is critical | Validate signatures; idempotency keys; DLQ for failed processing |
