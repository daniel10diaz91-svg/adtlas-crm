# 07 – Reporting

Server-side aggregates per role; see [09-scope-and-implementation-rules.md](09-scope-and-implementation-rules.md). Avoid N+1; add indexes; define caching policy.

## 1. Aggregations API per role

- **Endpoint:** e.g. `GET /api/dashboard/metrics` (or `/api/reporting/aggregates`). Session determines role; response shape varies by role:
  - **Pipeline by stage** – Counts per pipeline stage (leads or opportunities).
  - **Tasks due** – Count of tasks due today / overdue (per user or team).
  - **Team metrics** – For Manager: team pipeline, optional forecast.
  - **Cases by status/priority** – For Support: open cases by queue, by status, by priority.
  - **Admin / Manager:** Total leads, new this week, in pipeline (manager: team-only); per-stage counts; per-user (manager: team).
  - **Sales:** Same KPIs for “my” leads only (existing logic from `app/dashboard/page.tsx`).
  - **Support:** Open cases, by queue, my assigned cases.
  - **ReadOnly:** Same as corresponding role but no write; same aggregates.
- **Implementation:** Reuse or move the aggregation logic from `app/dashboard/page.tsx` into a server action or API route; add cases/queue stats when cases exist. Return JSON: `{ totalLeads, newThisWeek, inPipeline, chartData?, queueStats?, tasksDue?, pipelineByStage? }`.

## 2. Indexes needed

- **Existing:** tenant_id, created_at, assigned_to_user_id on leads; tenant on tasks.
- **Add for reporting:** Composite (tenant_id, created_at) on leads for “new this week” and chart; (tenant_id, stage_id) if filtering by stage is heavy. For cases: (tenant_id, queue_id, status), (assigned_to_user_id, status). For “team” queries: index on user_teams(team_id, user_id) and use it to filter leads by assigned_to_user_id IN (...).

## 3. Cache policy

- **Dashboard metrics:** Short TTL (e.g. 60s) for GET /api/dashboard/metrics; send Cache-Control or use in-memory cache (e.g. per-tenant key). Invalidate on lead/case create/update if real-time is required; otherwise TTL is enough.
- **List endpoints:** No change; keep existing list APIs uncached or with weak cache; focus cache on aggregates only.
