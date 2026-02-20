'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { FormMeta } from './form-meta';
import { FormWhatsApp } from './form-whatsapp';

type MetaSource = { id: string; external_id: string; name: string | null };

export function IntegracionesContent({ metaSources }: { metaSources: MetaSource[] }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{t('integrations.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t('integrations.subtitle')}</p>
      </div>

      {/* Meta Lead Ads */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">{t('integrations.metaLeadAds')}</h2>
        <p className="mt-2 text-sm text-zinc-600">{t('integrations.webhookHint')}</p>
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-800 break-all">
          [YOUR_APP_URL]/api/webhooks/meta/leads
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">{t('integrations.replaceUrl')}</p>
        <FormMeta />
        {metaSources.length > 0 ? (
          <div className="mt-6 border-t border-zinc-200 pt-4">
            <h3 className="text-sm font-medium text-zinc-700">{t('integrations.connectedSources')}</h3>
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

      {/* WhatsApp */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">{t('integrations.whatsappTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-600">{t('integrations.whatsappHint')}</p>
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-800 break-all">
          [YOUR_APP_URL]/api/webhooks/whatsapp
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">{t('integrations.whatsappVerifyTokenHint')}</p>
        <FormWhatsApp />
      </section>

      {/* Google */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">{t('integrations.googleTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-600">{t('integrations.googleComingSoon')}</p>
      </section>
    </div>
  );
}
