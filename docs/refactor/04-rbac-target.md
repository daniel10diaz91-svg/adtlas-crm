# 04 – RBAC target

**Enforcement:** At controller/service level and UI route guards (see [09-scope-and-implementation-rules.md](09-scope-and-implementation-rules.md)).

## 1. Role set

- **admin** – Full tenant: users, teams, queues, field settings, audit log, all leads/tasks/cases, assignment.
- **manager** – See and edit team's leads/tasks/cases; assign within team; no user/team/queue CRUD, no audit. Read all dashboards.
- **sales** – CRUD on own Leads/Contacts/Accounts/Opportunities/Activities; read-only others via sharing rules. No assignment of others; no users/queues. (Today: Lead = primary contact; Opportunities = pipeline/deals; Activities = tasks; Contacts/Accounts added when entities exist.)
- **support** – CRUD Cases and related Activities; read Accounts/Contacts; no Opportunity edits. No lead/task management, no user management.
- **readonly** – Read-only access to leads/tasks/cases (tenant-scoped or team-scoped by policy); no mutations.

(Current `ventas` is treated as `sales` for this matrix; migration maps it.)

---

## 2. CRUD matrix (per entity)

| Entity   | admin | manager | sales | support | readonly |
|----------|-------|---------|-------|---------|----------|
| Users    | CRUD  | R       | -     | -       | R        |
| Teams    | CRUD  | R       | -     | -       | R        |
| Leads    | CRUD  | CRUD*   | CRUD**| -       | R        |
| Tasks    | CRUD  | CRUD*   | CRUD**| -       | R        |
| Cases    | CRUD  | CRUD*   | -     | CRUD*** | R        |
| Queues   | CRUD  | R       | -     | R       | R        |
| Settings | CRUD  | -       | -     | -       | R        |
| Audit    | R     | -       | -     | -       | -        |

- \* Manager: CRUD only for records belonging to team members (and optionally unassigned in tenant).
- \** Sales: CRUD only on own Leads/Contacts/Accounts/Opportunities/Activities; read-only others via sharing rules.
- \*** Support: CRUD for cases in queues assigned to them / their team; read Accounts/Contacts; no Opportunity edits.

---

## 3. Route guards (high level)

- **Admin-only routes:** `/api/users` POST/PATCH/DELETE, `/api/teams`, `/api/queues`, `/api/field-settings`, `/api/audit`, `/dashboard/admin/*`.
- **Manager or Admin:** Assignment APIs (e.g. PATCH lead assigned_to); dashboard team metrics.
- **Sales:** Lead/task APIs with “own only” filter and mutation checks (existing pattern in `lib/permissions.ts`).
- **Support:** Case and queue APIs only (no lead/task write).
- **ReadOnly:** GET-only for leads, tasks, cases, users, teams; 403 on any POST/PATCH/DELETE from these roles.

Implement in: `middleware.ts` for route-level redirect (e.g. redirect readonly away from create pages) and in each API route or a shared `requireRole(['admin','manager'])`-style helper that returns 403.

---

## 4. Policy pseudocode

**Manager can see/edit team**

```text
function canAccessLead(user, lead):
  if user.role === 'admin' then return true
  if user.role === 'manager' then
    return lead.tenant_id === user.tenant_id and
           (lead.assigned_to_user_id in getTeamMemberIds(user) or lead.assigned_to_user_id is null)
  if user.role === 'sales' then return lead.assigned_to_user_id === user.id
  if user.role === 'readonly' then return lead.tenant_id === user.tenant_id
  return false
```

**Sales can edit own records only**

```text
function canUpdateLead(user, lead):
  if user.role === 'admin' then return true
  if user.role === 'manager' then return canAccessLead(user, lead)
  if user.role === 'sales' then return lead.assigned_to_user_id === user.id
  return false
```

**Assignment**

- `canSetLeadAssignment(user)`: admin or manager (manager only to team members).
- Validate `assigned_to_user_id` in same tenant and, for manager, in same team (using `user_teams` or equivalent).

These can live in `lib/permissions.ts` (or `lib/rbac-matrix.ts`) and be called from API handlers; keep existing function signatures where possible and add overloads or a single `can(user, action, resource)` for new roles.
