-- Fase 1: Cuotas por tenant, tablas contacts y messages, columnas en leads y pipeline_stages.
-- Ejecutar en Supabase: SQL Editor o supabase db push

-- Tenants: cuotas por workspace
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INT NOT NULL DEFAULT 15;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_leads INT NOT NULL DEFAULT 2500;

-- Contacts: único por (tenant_id, phone) para evitar duplicados por WhatsApp
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);

-- Leads: columnas para contacto, título y valor (contact_id nullable para compatibilidad)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS value DECIMAL(12,2);

-- Messages: historial por lead (inbound/outbound/internal_note)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'inbound' CHECK (type IN ('inbound', 'outbound', 'internal_note')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created ON messages(tenant_id, created_at DESC);

-- Pipeline stages: color para Kanban
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS color_hex TEXT;

-- RLS: contacts y messages
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_tenant" ON contacts;
CREATE POLICY "contacts_tenant" ON contacts FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "messages_tenant" ON messages;
CREATE POLICY "messages_tenant" ON messages FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);
