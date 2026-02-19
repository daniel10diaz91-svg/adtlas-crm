import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('tenant_id', session.user.tenantId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { origin, external_id, name } = body;
  if (!origin || !external_id) {
    return NextResponse.json({ error: 'origin and external_id are required' }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('lead_sources')
    .insert({
      tenant_id: session.user.tenantId,
      origin: origin.toLowerCase(),
      external_id: String(external_id),
      name: name || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
