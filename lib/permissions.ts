/**
 * Permission checks for leads and tasks (admin vs ventas, ownership).
 * All lead/task mutations should go through these before executing.
 */
import type { SessionUser } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';

export type AppRole = 'admin' | 'ventas';

export function isAdmin(user: SessionUser): boolean {
  return user.role === 'admin';
}

export function isVentas(user: SessionUser): boolean {
  return user.role === 'ventas';
}

/**
 * Only admin can set or change assignment. Ventas can only self-assign on create.
 */
export function canSetLeadAssignment(user: SessionUser): boolean {
  return user.role === 'admin';
}

/**
 * Ventas can only delete leads assigned to them. Admin can delete any lead in tenant.
 */
export async function canDeleteLead(
  userId: string,
  role: AppRole,
  leadId: string,
  tenantId: string
): Promise<{ allowed: boolean; notFound?: boolean }> {
  if (role === 'admin') return { allowed: true };
  const supabase = createServiceClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('assigned_to_user_id')
    .eq('id', leadId)
    .eq('tenant_id', tenantId)
    .single();
  if (error || !lead) return { allowed: false, notFound: true };
  return { allowed: lead.assigned_to_user_id === userId };
}

/**
 * Ventas can only update (e.g. stage) leads assigned to them. Admin can update any.
 */
export async function canUpdateLead(
  userId: string,
  role: AppRole,
  leadId: string,
  tenantId: string
): Promise<{ allowed: boolean; notFound?: boolean }> {
  if (role === 'admin') return { allowed: true };
  const supabase = createServiceClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('assigned_to_user_id')
    .eq('id', leadId)
    .eq('tenant_id', tenantId)
    .single();
  if (error || !lead) return { allowed: false, notFound: true };
  return { allowed: lead.assigned_to_user_id === userId };
}

/**
 * Ventas can only update tasks whose lead is assigned to them. Admin can update any task in tenant.
 */
export async function canUpdateTask(
  userId: string,
  role: AppRole,
  taskId: string,
  tenantId: string
): Promise<{ allowed: boolean; notFound?: boolean }> {
  if (role === 'admin') return { allowed: true };
  const supabase = createServiceClient();
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('lead_id')
    .eq('id', taskId)
    .eq('tenant_id', tenantId)
    .single();
  if (taskError || !task) return { allowed: false, notFound: true };
  if (!task.lead_id) return { allowed: true };
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('id', task.lead_id)
    .eq('assigned_to_user_id', userId)
    .single();
  return { allowed: !!lead };
}

/**
 * Validates that assigned_to_user_id belongs to the same tenant (for admin assignment).
 */
export async function isUserInTenant(
  userToAssignId: string,
  tenantId: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userToAssignId)
    .eq('tenant_id', tenantId)
    .single();
  return !!data;
}
