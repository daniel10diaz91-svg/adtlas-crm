import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkLeadQuota } from '@/lib/quota';

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? '';
const WHATSAPP_TENANT_ID = process.env.WHATSAPP_TENANT_ID ?? '';

/**
 * Meta WhatsApp Cloud API: verificación del webhook (GET).
 * Query: hub.mode, hub.verify_token, hub.challenge.
 * Si verify_token coincide con WHATSAPP_VERIFY_TOKEN, devolver el challenge en texto plano.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }
  if (!WHATSAPP_VERIFY_TOKEN || token !== WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 });
  }
  if (typeof challenge !== 'string') {
    return NextResponse.json({ error: 'Missing challenge' }, { status: 400 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/** Normaliza teléfono para búsqueda: solo dígitos, sin espacios. */
function normalizePhone(phone: string): string {
  return String(phone).replace(/\D/g, '').trim() || phone;
}

/** Extrae tenant_id: primero desde whatsapp_workspaces por phone_number_id, si no desde env WHATSAPP_TENANT_ID. */
async function resolveTenantId(
  supabase: ReturnType<typeof createServiceClient>,
  phoneNumberId: string
): Promise<string | null> {
  const { data: row } = await supabase
    .from('whatsapp_workspaces')
    .select('tenant_id')
    .eq('phone_number_id', phoneNumberId)
    .single();
  if (row?.tenant_id) return row.tenant_id;
  if (WHATSAPP_TENANT_ID) return WHATSAPP_TENANT_ID;
  return null;
}

/** Payload típico Meta WhatsApp Cloud API (mensaje entrante). */
type WhatsAppValue = {
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: Array<{
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
  }>;
};

/**
 * Meta WhatsApp Cloud API: mensaje entrante (POST).
 * Busca o crea contact por teléfono; si hay cuota, crea lead; siempre inserta message (inbound).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    if (change?.field !== 'messages') {
      return NextResponse.json({ ok: true });
    }
    const value: WhatsAppValue | undefined = change.value;
    const phoneNumberId = value?.metadata?.phone_number_id;
    const messages = value?.messages;
    if (!phoneNumberId || !messages?.length) {
      return NextResponse.json({ error: 'Missing metadata or messages' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const tenantId = await resolveTenantId(supabase, phoneNumberId);
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant configured for this WhatsApp number' },
        { status: 404 }
      );
    }

    const firstMessage = messages[0];
    const fromPhone = String(firstMessage.from ?? '').trim();
    const textBody =
      firstMessage.type === 'text'
        ? firstMessage.text?.body ?? ''
        : `[${firstMessage.type}]`;
    const contactName = value?.contacts?.[0]?.profile?.name ?? null;
    const phoneNormalized = normalizePhone(fromPhone);
    if (!phoneNormalized) {
      return NextResponse.json({ error: 'Invalid sender phone' }, { status: 400 });
    }

    let contactId: string | null = null;
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', phoneNormalized)
      .single();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact, error: contactErr } = await supabase
        .from('contacts')
        .insert({
          tenant_id: tenantId,
          phone: phoneNormalized,
          name: contactName,
        })
        .select('id')
        .single();
      if (contactErr) {
        if (contactErr.code === '23505') {
          const { data: again } = await supabase
            .from('contacts')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('phone', phoneNormalized)
            .single();
          contactId = again?.id ?? null;
        } else {
          return NextResponse.json({ error: contactErr.message }, { status: 500 });
        }
      } else {
        contactId = newContact?.id ?? null;
      }
    }

    let leadId: string | null = null;
    const leadQuota = await checkLeadQuota(tenantId, supabase);

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingLead) {
      leadId = existingLead.id;
    } else if (leadQuota.allowed && contactId) {
      const { data: firstStage } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('tenant_id', tenantId)
        .order('order', { ascending: true })
        .limit(1)
        .single();
      const { data: newLead, error: leadErr } = await supabase
        .from('leads')
        .insert({
          tenant_id: tenantId,
          contact_id: contactId,
          origin: 'manual',
          stage_id: firstStage?.id ?? null,
          name: contactName,
          phone: fromPhone,
        })
        .select('id')
        .single();
      if (!leadErr && newLead) leadId = newLead.id;
    }

    const { error: msgErr } = await supabase.from('messages').insert({
      tenant_id: tenantId,
      lead_id: leadId,
      content: textBody,
      type: 'inbound',
      is_read: false,
    });

    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }
}
