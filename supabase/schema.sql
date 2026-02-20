-- Esquema CRM multi-tenant Adtlas
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

-- Tenants (cada cliente de Adtlas es un tenant; cuotas por workspace)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  max_users INT NOT NULL DEFAULT 15,
  max_leads INT NOT NULL DEFAULT 2500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios (vinculados a un tenant; id coincide con auth.users.id)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'sales' CHECK (role IN ('admin', 'ventas', 'manager', 'sales', 'support', 'readonly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (único por tenant + phone; para WhatsApp e Inbox)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- Etapas del pipeline (por tenant) — antes que leads por la FK
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  color_hex TEXT
);

-- Orígenes de leads (mapeo form_id/page_id Meta → tenant para webhooks)
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin IN ('meta', 'google')),
  external_id TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(origin, external_id)
);

-- WhatsApp: mapeo phone_number_id (Meta Cloud API) → tenant para webhook
CREATE TABLE IF NOT EXISTS whatsapp_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (contact_id opcional; title/value para oportunidades; assigned_to_user_id: vendedor asignado)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_source_id UUID REFERENCES lead_sources(id),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES pipeline_stages(id),
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  origin TEXT NOT NULL CHECK (origin IN ('meta', 'google', 'manual')),
  name TEXT,
  email TEXT,
  phone TEXT,
  account_number TEXT,
  title TEXT,
  value DECIMAL(12,2),
  status TEXT DEFAULT 'new',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals / oportunidades (opcional; lead puede estar en una etapa)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
  value DECIMAL(12,2),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (historial por lead: inbound, outbound, internal_note)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'inbound' CHECK (type IN ('inbound', 'outbound', 'internal_note')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tareas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para filtrar por tenant
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_tenant_origin ON lead_sources(tenant_id, origin);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant ON pipeline_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created ON messages(tenant_id, created_at DESC);

-- RLS: cada tenant solo ve sus datos (activar después de crear políticas)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios ven solo las filas de su tenant (DROP por si ya existen)
DROP POLICY IF EXISTS "users_tenant" ON users;
CREATE POLICY "users_tenant" ON users FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "tenants_read" ON tenants;
CREATE POLICY "tenants_read" ON tenants FOR SELECT USING (
  id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "lead_sources_tenant" ON lead_sources;
CREATE POLICY "lead_sources_tenant" ON lead_sources FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "leads_tenant" ON leads;
CREATE POLICY "leads_tenant" ON leads FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "pipeline_stages_tenant" ON pipeline_stages;
CREATE POLICY "pipeline_stages_tenant" ON pipeline_stages FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "deals_tenant" ON deals;
CREATE POLICY "deals_tenant" ON deals FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "tasks_tenant" ON tasks;
CREATE POLICY "tasks_tenant" ON tasks FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "contacts_tenant" ON contacts;
CREATE POLICY "contacts_tenant" ON contacts FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "messages_tenant" ON messages;
CREATE POLICY "messages_tenant" ON messages FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Etapas por defecto al crear un tenant (se pueden insertar desde la app)
-- INSERT en pipeline_stages lo hará la app al crear el tenant
