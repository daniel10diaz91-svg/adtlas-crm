import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { isReadOnly } from '@/lib/permissions';
import { ok, serverError, badRequest, forbidden } from '@/lib/api-response';

export async function GET() {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const supabase = createServiceClient();
  let q = supabase
    .from('tasks')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('due_at', { ascending: true, nullsFirst: false });

  if (session.user.role === 'sales') {
    const { data: myLeadIds } = await supabase
      .from('leads')
      .select('id')
      .eq('tenant_id', session.user.tenantId)
      .eq('assigned_to_user_id', session.user.id);
    const ids = (myLeadIds ?? []).map((l) => l.id);
    if (ids.length === 0) return ok([]);
    q = q.in('lead_id', ids);
  }

  const { data, error } = await q;
  if (error) return serverError(error.message);
  return ok(data ?? []);
}

export async function POST(req: Request) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;
  if (isReadOnly(session.user) || session.user.role === 'support') return forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const { title, due_at, lead_id } = body as Record<string, unknown>;
  const titleStr = title && typeof title === 'string' ? title.trim() : '';
  if (!titleStr) return badRequest('title is required');

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      tenant_id: session.user.tenantId,
      title: titleStr,
      due_at: due_at && typeof due_at === 'string' ? due_at || null : null,
      lead_id: lead_id && typeof lead_id === 'string' ? lead_id : null,
    })
    .select()
    .single();
  if (error) return serverError(error.message);
  return ok(data);
}
