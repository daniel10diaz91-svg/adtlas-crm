-- Fase 2: Mapeo número WhatsApp (Meta) → tenant para el webhook.
-- Meta envía metadata.phone_number_id; aquí guardamos ese id para resolver tenant_id.

CREATE TABLE IF NOT EXISTS whatsapp_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_workspaces_tenant ON whatsapp_workspaces(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_workspaces_phone_number_id ON whatsapp_workspaces(phone_number_id);

COMMENT ON TABLE whatsapp_workspaces IS 'Mapeo phone_number_id (Meta Cloud API) → tenant para webhook WhatsApp. Sin filas: usar env WHATSAPP_TENANT_ID.';
