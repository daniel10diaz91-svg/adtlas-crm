import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkLeadQuota } from '@/lib/quota';

// Meta Lead Ads envía POST con el payload del lead.
// Ver: https://developers.facebook.com/docs/marketing-api/lead-ads/retrieving
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const formId = body?.entry?.[0]?.changes?.[0]?.value?.form_id ?? body?.form_id;
    const pageId = body?.entry?.[0]?.changes?.[0]?.value?.page_id ?? body?.page_id;
    const _leadgenId = body?.entry?.[0]?.changes?.[0]?.value?.leadgen_id ?? body?.leadgen_id;

    if (!formId || !pageId) {
      return NextResponse.json({ error: 'form_id or page_id missing' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const externalId = `${pageId}_${formId}`;

    const { data: source } = await supabase
      .from('lead_sources')
      .select('tenant_id')
      .eq('origin', 'meta')
      .eq('external_id', externalId)
      .single();

    if (!source) {
      return NextResponse.json(
        { error: 'No tenant configured for this form_id/page_id' },
        { status: 404 }
      );
    }

    const leadQuota = await checkLeadQuota(source.tenant_id, supabase);
    if (!leadQuota.allowed) {
      return NextResponse.json(
        { error: 'Límite de leads del workspace alcanzado' },
        { status: 403 }
      );
    }

    const fields = body?.entry?.[0]?.changes?.[0]?.value?.field_data ?? body?.field_data ?? [];
    const getField = (name: string) => {
      const f = fields.find((x: { name?: string }) => x.name === name);
      return f?.values?.[0] ?? '';
    };
    const name = getField('full_name') || getField('first_name') || getField('nombre') || getField('name') || '';
    const email = getField('email') || getField('e-mail') || getField('correo') || '';
    const phone = getField('phone_number') || getField('telefono') || getField('phone') || getField('cell') || '';

    const { data: firstStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('tenant_id', source.tenant_id)
      .order('order', { ascending: true })
      .limit(1)
      .single();

    const { error } = await supabase.from('leads').insert({
      tenant_id: source.tenant_id,
      origin: 'meta',
      stage_id: firstStage?.id ?? null,
      name: name || null,
      email: email || null,
      phone: phone || null,
      raw_data: body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }
}

// Meta a veces hace GET para verificar la URL del webhook
export async function GET() {
  return NextResponse.json({ ok: true });
}
