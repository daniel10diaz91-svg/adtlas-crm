# 05 – UX upgrade

Aligned with [09-scope-and-implementation-rules.md](09-scope-and-implementation-rules.md) (Kommo/GoHighLevel style).

## 1. Screens to adjust

### Home by role

- **Current:** `app/dashboard/page.tsx` – single layout: KPIs (total, new this week, in pipeline), chart, recent leads, links to Add lead / Pipeline.
- **Change:** Branch content (or swap components) by `session.user.role`:
  - **Admin / Manager:** Keep or extend with “team” KPIs (manager: only team members’ leads).
  - **Sales:** Same KPIs but filtered to “my leads” (already done via `leadFilter` when role === 'ventas'; generalize to `sales`).
  - **Support:** Replace or add “queue stats” (e.g. open cases by queue, my assigned cases).
  - **ReadOnly:** Same as sales or manager view but no action buttons (or hide “Add lead”, “Open pipeline”).
- **Files:** `app/dashboard/page.tsx`; optional `components/dashboard/DashboardHomeAdmin.tsx`, `DashboardHomeSales.tsx`, `DashboardHomeSupport.tsx`.

### Kanban (Opportunities)

- **Stages (standard):** [Prospecting, Qualification, Proposal, Negotiation, Won, Lost]. Seed or migrate `pipeline_stages` so new tenants get these (see 09).
- **Current:** `app/dashboard/pipeline/page.tsx` + `pipeline-kanban.tsx` – drag-and-drop and stage dropdown; role-based lead filter already applied in API and data fetch.
- **Change:** Keep as-is for “Opportunities”; ensure manager sees team leads, sales sees own. Add quick action “Change stage” on card if not already (dropdown is present). Consider “Assign” on card for admin/manager.

### Cases queue

- **New:** `/dashboard/cases` – list or board of cases, filter by queue. **Bulk assign, reassign, close.** **SLA placeholders** (e.g. column or field for due date / SLA tier; no full SLA engine in MVP). Support sees only queues assigned to them; manager sees team queues; admin sees all. Reuse list/table patterns from `app/dashboard/leads/leads-list.tsx`.

### Record pages (Leads; later Cases)

- **Current:** No dedicated lead detail page; edit is inline or via separate form.
- **Target:** `/dashboard/leads/[id]` – single record page with tabs:
  - **Details** – form or read-only fields (name, email, phone, stage, assigned to, source, etc.).
  - **Activities** – list of tasks and optionally future “activity” events (calls, emails if added later).
  - **Related** – related deals, cases (when entities exist).
  - **Timeline** – chronological audit of changes (from audit_log or created_at/updated_at events).
- **Implementation:** New `app/dashboard/leads/[id]/page.tsx` with tab state; fetch lead by id (with permission check); reuse existing PATCH for updates. Links from leads list and Kanban to this URL.

---

## 2. Saved views

- **Presets:** “Mis registros” (assigned_to = me), “Mi equipo” (assigned_to in my team; manager), “Todos” (tenant; admin/manager).
- **Backend:** Either query params (e.g. `?view=mine|team|all`) or a small `saved_views` table (user_id, name, filters JSON). Start with query params to avoid schema change.
- **Frontend:** Selector (tabs or dropdown) on leads list (`app/dashboard/leads/page.tsx` / `leads-list.tsx`); same for cases list when cases exist. Default: “Mis registros” for sales, “Todos” or “Mi equipo” for manager, “Todos” for admin.

---

## 3. Quick actions

- **Create task** – Opens task form with lead pre-filled (or inline modal). Use existing `app/dashboard/tareas/nuevo` with query `?leadId=...`.
- **Change stage** – Already in pipeline Kanban (dropdown); add same dropdown or modal on leads list row and on lead detail page.
- **Assign** – Dropdown “Assigned to” (admin/manager only) on list row and on detail page; calls PATCH `api/leads/[id]` with `assigned_to_user_id`.

Reusable component: e.g. `components/dashboard/QuickActionsLead.tsx` (receives lead, session.role; renders buttons/dropdowns and calls existing APIs). Use on `leads-list.tsx` and `app/dashboard/leads/[id]/page.tsx`.
