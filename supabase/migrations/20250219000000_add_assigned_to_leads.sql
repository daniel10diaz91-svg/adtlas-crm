-- Asignación de leads por vendedor: solo ventas ve sus leads; admin ve todos y puede asignar.
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to_user_id);

COMMENT ON COLUMN leads.assigned_to_user_id IS 'Vendedor asignado; NULL = sin asignar. Solo admin puede cambiar.';
