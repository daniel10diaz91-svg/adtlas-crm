import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { ok, serverError, badRequest } from '@/lib/api-response';

const ALLOWED_ORIGINS = ['meta', 'google'] as const;

export async function GET() {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });
  if (error) return serverError(error.message);
  return ok(data ?? []);
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
  const { origin, external_id, name } = body as Record<string, unknown>;
  if (!origin || !external_id) return badRequest('origin and external_id are required');
  const originStr = String(origin).toLowerCase();
  if (!ALLOWED_ORIGINS.includes(originStr as (typeof ALLOWED_ORIGINS)[number])) {
    return badRequest('Invalid origin');
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('lead_sources')
    .insert({
      tenant_id: session.user.tenantId,
      origin: originStr,
      external_id: String(external_id),
      name: name && typeof name === 'string' ? name || null : null,
    })
    .select()
    .single();
  if (error) return serverError(error.message);
  return ok(data);
}
