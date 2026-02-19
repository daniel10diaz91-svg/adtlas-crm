import { getSessionOr401 } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, serverError, forbidden, notFound, badRequest, validateUuidParam } from '@/lib/api-response';
import { NextResponse } from 'next/server';

const ALLOWED_ROLES = ['admin', 'manager', 'sales', 'support', 'readonly'];

/** Update user name/role (admin only). Cannot change own role or demote last admin. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;
  if (session.user.role !== 'admin') return forbidden();

  const { id } = await params;
  const invalidId = validateUuidParam(id);
  if (invalidId) return invalidId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const { name, role } = body as Record<string, unknown>;
  const updates: { name?: string | null; role?: string } = {};
  if (name !== undefined) updates.name = name && typeof name === 'string' ? name.trim() || null : null;
  if (role !== undefined) {
    if (typeof role !== 'string' || !ALLOWED_ROLES.includes(role)) return badRequest('Invalid role');
    updates.role = role;
  }
  if (Object.keys(updates).length === 0) return ok({});

  const supabase = createServiceClient();
  const { data: target } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId)
    .single();
  if (!target) return notFound();

  if (target.id === session.user.id && updates.role && updates.role !== 'admin') {
    return NextResponse.json({ error: 'Cannot change your own role from admin' }, { status: 400 });
  }
  if (target.role === 'admin' && updates.role && updates.role !== 'admin') {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', session.user.tenantId)
      .eq('role', 'admin');
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId)
    .select('id, name, email, role')
    .single();
  if (error) return serverError(error.message);
  return ok(data);
}
