/**
 * Permission checks for leads and tasks (RBAC: admin, manager, sales, support, readonly).
 * All lead/task mutations should go through these before executing.
 */
import type { SessionUser } from '@/lib/session';
import type { AppRole } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';

export type { AppRole };

export function isAdmin(user: SessionUser): boolean {
  return user.role === 'admin';
}

export function isManager(user: SessionUser): boolean {
  return user.role === 'manager';
}

export function isSales(user: SessionUser): boolean {
  return user.role === 'sales';
}

export function isSupport(user: SessionUser): boolean {
  return user.role === 'support';
}

/** ReadOnly cannot perform any write (POST/PATCH/DELETE). */
export function isReadOnly(user: SessionUser): boolean {
  return user.role === 'readonly';
}

/** Admin or manager can set/change lead assignment. Manager: same tenant (team filter later). */
export function canSetLeadAssignment(user: SessionUser): boolean {
  return user.role === 'admin' || user.role === 'manager';
}

/** Sales/Support/ReadOnly cannot write leads; Support will get case write in Phase 2. */
export function canWriteLeads(user: SessionUser): boolean {
  return !isReadOnly(user) && user.role !== 'support';
}

/**
 * Admin and manager can delete any lead in tenant. Sales: only own. Support/ReadOnly: no.
 */
export async function canDeleteLead(
  userId: string,
  role: AppRole,
  leadId: string,
  tenantId: string
): Promise<{ allowed: boolean; notFound?: boolean }> {
  if (role === 'admin' || role === 'manager') return { allowed: true };
  if (role === 'support' || role === 'readonly') return { allowed: false };
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
 * Admin and manager can update any lead in tenant. Sales: only own. Support/ReadOnly: no.
 */
export async function canUpdateLead(
  userId: string,
  role: AppRole,
  leadId: string,
  tenantId: string
): Promise<{ allowed: boolean; notFound?: boolean }> {
  if (role === 'admin' || role === 'manager') return { allowed: true };
  if (role === 'support' || role === 'readonly') return { allowed: false };
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
 * Admin and manager can update any task in tenant. Sales: only tasks whose lead is assigned to them. Support/ReadOnly: no.
 */
export async function canUpdateTask(
  userId: string,
  role: AppRole,
  taskId: string,
  tenantId: string
): Promise<{ allowed: boolean; notFound?: boolean }> {
  if (role === 'admin' || role === 'manager') return { allowed: true };
  if (role === 'support' || role === 'readonly') return { allowed: false };
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
 * Validates that assigned_to_user_id belongs to the same tenant (for admin/manager assignment).
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
