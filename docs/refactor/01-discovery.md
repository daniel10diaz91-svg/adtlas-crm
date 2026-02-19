# 01 – Discovery: Current Architecture

## 1. Current architecture map

### Backend

- **Runtime:** Next.js 14+ (App Router), Node.js.
- **Auth:** NextAuth (Credentials) + Supabase Auth. Session is JWT; no DB session table.
  - Config: `lib/auth.ts` (authorize → Supabase `signInWithPassword`, then load `users` + `tenants`).
  - Session shape: `id`, `email`, `name`, `tenantId`, `tenantName`, `role` (see `lib/session.ts`).
- **Data access:** Supabase (Postgres) via `@supabase/supabase-js`.
  - Service role client: `lib/supabase/service.ts` (server-only, no RLS bypass in app logic; RLS is tenant-based).
  - Server/client: `lib/supabase/server.ts`, `lib/supabase/client.ts` (anon; minimal use in current flows).
- **API surface:** All under `app/api/`:
  - `GET/POST /api/lead-sources` – list/create lead sources (tenant-scoped).
  - `GET/POST /api/leads`, `PATCH/DELETE /api/leads/[id]` – leads CRUD + assignment (role-aware).
  - `GET/POST /api/tasks`, `PATCH /api/tasks/[id]` – tasks (ventas sees only tasks for assigned leads).
  - `GET /api/users` – list tenant users (admin only).
  - `POST /api/auth/signup` – create tenant + first user (admin) + default pipeline stages.
  - `GET/POST /api/auth/[...nextauth]` – NextAuth handler.
  - `GET/POST /api/webhooks/meta/leads` – Meta Lead Ads webhook (no auth; keyed by `lead_sources`).

### Frontend

- **Framework:** React 18, Next.js App Router.
- **UI:** Tailwind CSS. No shared component library; dashboard components in `components/dashboard/` (Sidebar, TopBar, KpiCard, LeadsChart, RecentLeadsTable).
- **Dashboard layout:** `app/dashboard/layout.tsx` – sidebar (240px) + top bar + main; uses `getSession()` and redirects to `/login` if no session.
- **Pages:**
  - `app/page.tsx` – landing; redirect to `/dashboard` if session.
  - `app/login/page.tsx`, `app/registro/page.tsx` – login/signup forms.
  - `app/dashboard/page.tsx` – Home: KPIs (total leads, new this week, in pipeline), LeadsChart (14 days), RecentLeadsTable, quick actions (Add lead, Open pipeline).
  - `app/dashboard/leads/page.tsx` – leads list (role filter: ventas = assigned only); `leads-list.tsx` has filters (All/Meta/Google/Manual), Assigned to dropdown (admin only), delete.
  - `app/dashboard/leads/nuevo/page.tsx` – new lead form; admin can “Assign to”.
  - `app/dashboard/pipeline/page.tsx` – Kanban (`pipeline-kanban.tsx` with @dnd-kit), drag-and-drop + stage dropdown.
  - `app/dashboard/tareas/page.tsx` – tasks list (Today/Upcoming/All); ventas sees only tasks for assigned leads.
  - `app/dashboard/tareas/nuevo/page.tsx` – new task form.
  - `app/dashboard/integraciones/page.tsx` – Meta Lead Ads: webhook URL, form (Page ID, Form ID), list of connected sources.

### Database (Supabase Postgres)

- **Schema:** `supabase/schema.sql`.
- **Tables:** `tenants`, `users` (id = auth.users.id, tenant_id, email, name, role), `pipeline_stages`, `lead_sources`, `leads` (tenant_id, lead_source_id, stage_id, assigned_to_user_id, origin, name, email, phone, status, raw_data, created_at), `deals`, `tasks`.
- **RLS:** Enabled on all; policies are tenant-based (`tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())`). App uses service role for server-side queries and enforces role/ownership in application code (`lib/permissions.ts` + API routes).
- **Indexes:** tenant_id, created_at, assigned_to_user_id on leads; tenant on tasks, pipeline_stages, lead_sources.

---

## 2. Current RBAC model summary and pain points

- **Roles:** Two only: `admin` and `ventas` (see `users.role` CHECK in `supabase/schema.sql` and `AppRole` in `lib/permissions.ts`).
- **Admin:** Full tenant access; can list/create users (only via GET /api/users today; no POST to create users in UI); can assign/reassign and delete any lead; sees all leads/tasks.
- **Ventas:** Sees only leads where `assigned_to_user_id = self`; can create leads (auto-assigned to self); can edit/delete only own assigned leads; tasks filtered by lead ownership.
- **Pain points:**
  - No “Manager” (see team, assign, no user management).
  - No “Support” or “ReadOnly”; no cases/queues.
  - No admin UI to create users (vendedores/gerentes); only signup creates one admin per tenant.
  - Role stored in DB but permission logic is spread across APIs and pages (no single matrix).
  - Sidebar is static; no role-based menu visibility.

---

## 3. Core flows

- **Leads → Opportunities:** Lead is created (manual or Meta webhook); has `stage_id` (pipeline_stages). Pipeline Kanban and PATCH `/api/leads/[id]` (stage_id) move leads. Table `deals` exists but is unused in UI.
- **Cases:** Not present. No cases table, no queue, no support flow.
- **Activities:** Tasks only. Tasks have optional `lead_id`; no activity timeline or “Activities” tab on records.
- **Reporting:** Dashboard home has server-side aggregates (counts, chart by day); no role-specific dashboard variants, no saved views or filters.

---

## 4. Current integrations and data flow

- **Inbound:** Meta Lead Ads only. `POST /api/webhooks/meta/leads` receives payload; looks up `lead_sources` by `page_id + form_id` → tenant_id; parses field_data (name, email, phone); inserts into `leads` with first pipeline stage. No signature verification; no retry/DLQ.
- **Outbound:** None. No Google Ads offline conversions, no WhatsApp, no webhook callbacks.
- **Config:** Integraciones page stores Page ID + Form ID in `lead_sources` (origin `meta`). No adapter abstraction; webhook handler is monolithic in `app/api/webhooks/meta/leads/route.ts`.

---

## 5. High-level UX gaps vs desired (per role)

- **Admin:** Has full access; missing: user/team management UI, queues, field settings, audit log.
- **Manager (not present):** Desired: see all team data, assign leads, no user CRUD; currently no role.
- **Sales (ventas):** Has “own records only”; missing: saved views (“Mis registros”, “Mi equipo”), quick actions consistent with Kommo/GHL.
- **Support / ReadOnly (not present):** No cases queue, no read-only or support-specific views.
- **Global:** No record detail page with tabs (Details/Activities/Related/Timeline); no queues; no saved views; Kanban exists and is good base for “Opportunities” UX.
