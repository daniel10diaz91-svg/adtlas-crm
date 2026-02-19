# 08 – Supportability

Aligned with [09-scope-and-implementation-rules.md](09-scope-and-implementation-rules.md) (tests, seeds, docs, telemetry, feature flags).

## 1. Seeds

- **Current:** Signup creates tenant, first user (admin), default pipeline stages. No seed script for dev data.
- **Add:** Demo org seed: **one user per role** (admin, manager, sales, support, readonly), **sample pipeline** (e.g. stages Prospecting → Won/Lost), **sample cases** (with queues), **demo campaigns and messages** (e.g. lead sources, sample WhatsApp or Meta payloads). `scripts/seed.ts` or Supabase seed SQL; run only in dev/staging; idempotent (e.g. by tenant name or env). Used so dashboards render aggregates from seeded data (acceptance check).

## 2. Tests

- **Auth/RBAC:** Login per role; CRUD checks per role (each role's CRUD conforms to RBAC).
- **Lead conversion:** Create lead → convert → opportunity in Kanban.
- **Opportunities Kanban:** Queries return correct leads per role (sales own, manager team).
- **Case queue assign:** Support flow: case intake → assign queue → assign agent → close; audit trail.
- **Integrations stubs:** Endpoints accept payloads, validate, persist; queue jobs created; no unhandled exceptions.

## 3. Swagger / OpenAPI coverage

- **Add:** OpenAPI spec (e.g. `docs/openapi.yaml` or generated from route metadata) for public API: `/api/leads`, `/api/tasks`, `/api/users`, `/api/dashboard/metrics`, webhooks (optional, with “x-internal” or exclude from public doc). Use for client generation and Postman import.

## 4. Postman collection

- **Add:** `docs/postman/AdtlasCRM.json` – environment (base_url, tenant_id, auth token); folders: Auth (login, get session), Leads (list, create, get, update, delete), Tasks, Users (admin), Dashboard metrics. Use NextAuth session token or API key if added later.

## 5. Telemetry – logging (correlation_id)

- **Structured logs:** Middleware or API wrapper generates or forwards `correlation_id` (e.g. `X-Correlation-Id` or new UUID per request). Attach to all log lines (structured JSON: correlation_id, role, tenant_id, path). **Feature flags** for risky changes (see 09 F).

## 6. Error format

- **Standard:** Consistent shape: `{ error_code, message, details?, correlation_id }`. Success remains `{ data }`. Align `lib/api-response.ts` so errors include `error_code` and `correlation_id` when available. Avoid leaking stack or internal details in production.

## 7. Feature flags

- Use for risky changes (new RBAC matrix, new integrations). Env toggles: e.g. `USE_NEW_RBAC`, `META_VERIFY_SIGNATURE`, `GOOGLE_ADS_OFFLINE_ENABLED`, `WHATSAPP_WEBHOOK_ENABLED`.

## 8. Admin playbook

- **Document in repo (e.g. `docs/admin-playbook.md`):** How to create first admin (signup); how to add users (admin UI or API); how to map Meta form to tenant (Integraciones); how to check audit log; how to enable/disable integrations (env); where to find correlation_id in logs; how to run migrations and rollback; contact for incidents.
