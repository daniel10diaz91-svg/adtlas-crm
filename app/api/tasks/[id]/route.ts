import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { done, title, due_at } = body;
  const supabase = createServiceClient();
  const updates: { done?: boolean; title?: string; due_at?: string | null } = {};
  if (typeof done === 'boolean') updates.done = done;
  if (title !== undefined) updates.title = title;
  if (due_at !== undefined) updates.due_at = due_at || null;
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', session.user.tenantId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
