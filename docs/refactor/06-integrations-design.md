# 06 – Integrations design

All integration routes and adapters under `/integrations/*`: routes in `app/api/integrations/...`, adapters and DTOs in `lib/integrations/`. See [09-scope-and-implementation-rules.md](09-scope-and-implementation-rules.md) for scope.

## 1. Canonical routes and adapters

- **Meta:** `POST /api/integrations/meta/webhook` – Create Lead with `source='Meta'`. Verify signature placeholder (e.g. `X-Hub-Signature-256` vs app secret); if `META_VERIFY_SIGNATURE=true` and invalid, return 401. Adapter in `lib/integrations/meta/` (or `lib/integrations/meta-lead-ads.ts`): parse payload → DTO; lookup tenant from `lead_sources`; create lead. On failure: DLQ or log for retry. Migration note: existing `app/api/webhooks/meta/leads/route.ts` can proxy to this or redirect during transition.
- **Google Ads offline conversions:** `POST /api/integrations/google/offline-conversion` – Body: `{ gclid | wbraid, timestamp, value, currency }`. Validate; enqueue job (adapter interface); write to `conversion_uploads` or job table for idempotency and retry. Stub returns 200 and logs. Env: `GOOGLE_ADS_OFFLINE_ENABLED`.
- **WhatsApp:** `POST /api/integrations/whatsapp/webhook` – Verify signature (placeholder); parse payload → DTO (from, to, message type, body); **persist Message**, link to Contact/Case. `POST /api/integrations/whatsapp/send` – Outbound: provider adapter (e.g. `lib/integrations/whatsapp/send-adapter.ts`) with `sendMessage(to, body)`. Persist outbound message and link to Contact/Case. Env: `WHATSAPP_WEBHOOK_ENABLED`.

## 2. DTOs and signature verification

- **DTOs:** Define in `lib/integrations/dto.ts` or per integration (e.g. `MetaLeadPayload`, `GoogleAdsConversionPayload`, `WhatsAppInboundPayload`) so parsing and validation are in one place; webhook routes only do HTTP + verify + call adapter.
- **Signature verification:** Placeholder functions: `verifyMetaSignature(body, signature, secret)`, `verifyWhatsAppSignature(body, signature)`, etc. Return boolean; route returns 401 when verification is enabled and fails.

## 3. Retry / DLQ strategy

- Use a **DLQ table** (e.g. `webhook_events` or `integration_jobs`: payload hash, source, status, error, created_at). On adapter or DB failure: log with correlation_id; write to DLQ. No synchronous retry in webhook handler. Optional: background job that reads failed rows and re-calls adapter with retry/backoff.

## 4. Healthchecks

- `GET /api/health` – returns 200 and optionally { integrations: { meta: true, googleAds: false, whatsapp: false } } from env toggles. Use for monitoring without exposing secrets.
