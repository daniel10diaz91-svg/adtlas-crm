import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, email, password, name } = body;
    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: 'Company name, email and password are required' },
        { status: 400 }
      );
    }
    const supabase = createServiceClient();
    const slug = slugify(companyName) || 'empresa';

    // 1) Crear tenant
    const { data: tenant, error: errTenant } = await supabase
      .from('tenants')
      .insert({ name: companyName, slug })
      .select('id')
      .single();
    if (errTenant) {
      if (errTenant.code === '23505') {
        return NextResponse.json(
          { error: 'A company with a very similar name already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: errTenant.message }, { status: 500 });
    }

    // 2) Crear usuario en Auth (Supabase Admin)
    const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || email },
    });
    if (errAuth) {
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ error: errAuth.message }, { status: 400 });
    }
    if (!authData.user) {
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ error: 'Could not create user' }, { status: 500 });
    }

    // 3) Insertar en public.users
    const { error: errUser } = await supabase.from('users').insert({
      id: authData.user.id,
      tenant_id: tenant.id,
      email,
      name: name || email,
      role: 'admin',
    });
    if (errUser) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ error: errUser.message }, { status: 500 });
    }

    // 4) Default pipeline stages (Kommo/GoHighLevel style)
    await supabase.from('pipeline_stages').insert([
      { tenant_id: tenant.id, name: 'Prospecting', order: 0 },
      { tenant_id: tenant.id, name: 'Qualification', order: 1 },
      { tenant_id: tenant.id, name: 'Proposal', order: 2 },
      { tenant_id: tenant.id, name: 'Negotiation', order: 3 },
      { tenant_id: tenant.id, name: 'Won', order: 4 },
      { tenant_id: tenant.id, name: 'Lost', order: 5 },
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    const isDev = process.env.NODE_ENV === 'development';
    if (message.includes('does not exist') || message.includes('relation')) {
      return NextResponse.json(
        { error: 'Tables do not exist in Supabase. Run supabase/schema.sql in your project SQL Editor.' },
        { status: 500 }
      );
    }
    if (message.includes('Missing Supabase')) {
      return NextResponse.json(
        { error: 'Missing Supabase variables in .env.local (URL and SERVICE_ROLE_KEY).' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: isDev ? message : 'Server error' },
      { status: 500 }
    );
  }
}
