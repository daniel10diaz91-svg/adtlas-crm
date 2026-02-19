import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { isUserInTenant } from '@/lib/permissions';
import { ok, serverError, badRequest } from '@/lib/api-response';

export async function GET(req: Request) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const origin = searchParams.get('origin');
  const supabase = createServiceClient();
  let q = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });
  if (session.user.role === 'ventas') {
    q = q.eq('assigned_to_user_id', session.user.id);
  }
  if (origin) q = q.eq('origin', origin);
  const { data, error } = await q;
  if (error) return serverError(error.message);
  return ok(data);
}

export async function POST(req: Request) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const { name, email, phone, assigned_to_user_id: bodyAssigned } = body as Record<string, unknown>;
  let assignedToUserId: string | null = null;
  if (session.user.role === 'admin' && bodyAssigned !== undefined) {
    const id = bodyAssigned && typeof bodyAssigned === 'string' ? bodyAssigned : null;
    if (id && !(await isUserInTenant(id, session.user.tenantId))) {
      return badRequest('Invalid assignee');
    }
    assignedToUserId = id;
  } else if (session.user.role === 'ventas') {
    assignedToUserId = session.user.id;
  }

  const supabase = createServiceClient();
  const { data: firstStage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('tenant_id', session.user.tenantId)
    .order('order', { ascending: true })
    .limit(1)
    .single();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      tenant_id: session.user.tenantId,
      origin: 'manual',
      stage_id: firstStage?.id ?? null,
      assigned_to_user_id: assignedToUserId,
      name: typeof name === 'string' ? name || null : null,
      email: typeof email === 'string' ? email || null : null,
      phone: typeof phone === 'string' ? phone || null : null,
    })
    .select()
    .single();
  if (error) return serverError(error.message);
  return ok(data);
}
