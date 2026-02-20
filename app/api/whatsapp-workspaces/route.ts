import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError, badRequest, forbidden } from '@/lib/api-response';
import { isReadOnly } from '@/lib/permissions';

/** GET: listar whatsapp_workspaces del tenant (cualquier rol autenticado). */
export async function GET() {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('whatsapp_workspaces')
    .select('id, phone_number_id, created_at')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });
  if (error) return serverError(error.message);
  return ok(data ?? []);
}

/** POST: añadir phone_number_id para el tenant. Solo admin o manager. */
export async function POST(req: Request) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;
  if (isReadOnly(session.user)) return forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const { phone_number_id } = body as Record<string, unknown>;
  const id = typeof phone_number_id === 'string' ? phone_number_id.trim() : '';
  if (!id) return badRequest('phone_number_id is required');

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('whatsapp_workspaces')
    .insert({ tenant_id: session.user.tenantId, phone_number_id: id })
    .select()
    .single();
  if (error) return serverError(error.message);
  return ok(data);
}
