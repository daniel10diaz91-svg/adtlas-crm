import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getSessionOr401 } from '@/lib/session';
import { checkUserQuota } from '@/lib/quota';
import { ok, serverError } from '@/lib/api-response';

export async function GET() {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;

  if (session.user.role !== 'admin' && session.user.role !== 'manager') {
    return ok({ users: [] });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });
  if (error) return serverError(error.message);
  return ok({ users: data ?? [] });
}

/** Create user (admin only). Role: manager | sales | support | readonly. */
export async function POST(req: Request) {
  const [session, authErr] = await getSessionOr401();
  if (authErr) return authErr;
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { email, password, name, role } = body as Record<string, unknown>;
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  const allowedRoles = ['manager', 'sales', 'support', 'readonly'];
  const roleStr = role && typeof role === 'string' && allowedRoles.includes(role) ? role : 'sales';

  const supabase = createServiceClient();
  const userQuota = await checkUserQuota(session.user.tenantId, supabase);
  if (!userQuota.allowed) {
    return NextResponse.json(
      { error: 'Límite de usuarios del workspace alcanzado' },
      { status: 403 }
    );
  }
  const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password: String(password),
    email_confirm: true,
    user_metadata: { name: (name && typeof name === 'string' ? name : email).trim() },
  });
  if (errAuth) {
    return NextResponse.json({ error: errAuth.message }, { status: 400 });
  }
  if (!authData.user) {
    return NextResponse.json({ error: 'Could not create user' }, { status: 500 });
  }

  const { error: errUser } = await supabase.from('users').insert({
    id: authData.user.id,
    tenant_id: session.user.tenantId,
    email: authData.user.email!,
    name: (name && typeof name === 'string' ? name : email).trim() || null,
    role: roleStr,
  });
  if (errUser) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: errUser.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      id: authData.user.id,
      email: authData.user.email,
      name: (name && typeof name === 'string' ? name : email).trim() || null,
      role: roleStr,
    },
  });
}
