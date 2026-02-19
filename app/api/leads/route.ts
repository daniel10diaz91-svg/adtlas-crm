import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get('origin');
  const supabase = createServiceClient();
  let q = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });
  if (origin) q = q.eq('origin', origin);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name, email, phone } = body;
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
      name: name || null,
      email: email || null,
      phone: phone || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
