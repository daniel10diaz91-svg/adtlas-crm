import { getSession } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { FormMeta } from './form-meta';

export default async function IntegracionesPage() {
  const session = await getSession();
  if (!session) return null;
  const supabase = createServiceClient();
  const { data: sources } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('tenant_id', session.user.tenantId);

  const metaSources = sources?.filter((s) => s.origin === 'meta') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect your Meta or Google forms so leads flow into the CRM.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">Meta Lead Ads</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Register the page_id and form_id of your Lead Ads form. Use this webhook URL in Meta:
        </p>
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-800 break-all">
          [YOUR_APP_URL]/api/webhooks/meta/leads
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          Replace [YOUR_APP_URL] with your app URL (e.g. https://app.adtlas.com).
        </p>
        <FormMeta />
        {metaSources.length > 0 ? (
          <div className="mt-6 border-t border-zinc-200 pt-4">
            <h3 className="text-sm font-medium text-zinc-700">Connected sources</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {metaSources.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-800">Meta</span>
                  <span className="text-zinc-700">{s.external_id}</span>
                  {s.name && <span className="text-zinc-500">— {s.name}</span>}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
