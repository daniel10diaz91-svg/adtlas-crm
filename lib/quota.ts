import type { SupabaseClient } from '@supabase/supabase-js';

export type QuotaResult = {
  allowed: boolean;
  current: number;
  max: number;
};

/**
 * Comprueba si el tenant puede añadir un usuario más (count < max_users).
 * Usar antes de insertar en public.users (invite, no signup inicial).
 */
export async function checkUserQuota(
  tenantId: string,
  supabase: SupabaseClient
): Promise<QuotaResult> {
  const [{ data: tenantRow }, { count }] = await Promise.all([
    supabase.from('tenants').select('max_users').eq('id', tenantId).single(),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);
  const max = tenantRow?.max_users ?? 15;
  const current = count ?? 0;
  return { allowed: current < max, current, max };
}

/**
 * Comprueba si el tenant puede crear un lead más (count < max_leads).
 * Usar antes de insertar en leads (manual, Meta, WhatsApp).
 */
export async function checkLeadQuota(
  tenantId: string,
  supabase: SupabaseClient
): Promise<QuotaResult> {
  const [{ data: tenantRow }, { count }] = await Promise.all([
    supabase.from('tenants').select('max_leads').eq('id', tenantId).single(),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);
  const max = tenantRow?.max_leads ?? 2500;
  const current = count ?? 0;
  return { allowed: current < max, current, max };
}
