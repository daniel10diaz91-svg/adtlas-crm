'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  origin: string;
  stage_id: string | null;
  assigned_to_user_id: string | null;
  status: string;
  created_at: string;
};

type Stage = { id: string; name: string; order: number };
type Task = { id: string; title: string; due_at: string | null; done: boolean; created_at?: string };
type User = { id: string; name: string | null; email: string };

type TimelineEvent = {
  id: string;
  at: string;
  type: 'created' | 'task';
  label: string;
  detail?: string;
};

const TABS = ['details', 'activities', 'related', 'timeline'] as const;

function buildTimelineEvents(
  lead: Lead,
  tasks: Task[],
  t: (k: import('@/lib/i18n').TranslationKey) => string,
  locale: string
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: 'created',
      at: lead.created_at,
      type: 'created',
      label: t('timeline.leadCreated'),
      detail: lead.origin ? `${t('timeline.origin')}: ${lead.origin}` : undefined,
    },
  ];
  const dateOpts: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' };
  tasks.forEach((task) => {
    if (task.created_at) {
      events.push({
        id: task.id,
        at: task.created_at,
        type: 'task',
        label: task.done
          ? `${t('timeline.taskCompleted')}: ${task.title}`
          : `${t('timeline.task')}: ${task.title}`,
        detail: task.due_at
          ? `${t('timeline.dueDate')}: ${new Date(task.due_at).toLocaleDateString(locale === 'es' ? 'es' : 'en', dateOpts)}`
          : undefined,
      });
    }
  });
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events;
}

function TimelineTab({
  lead,
  stages,
  tasks,
  t,
  locale,
}: {
  lead: Lead;
  stages: Stage[];
  tasks: Task[];
  t: (k: import('@/lib/i18n').TranslationKey) => string;
  locale: string;
}) {
  const events = buildTimelineEvents(lead, tasks, t, locale);
  const currentStage = stages.find((s) => s.id === lead.stage_id);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-0">
        {currentStage && (
          <p className="mb-4 text-sm text-zinc-600">
            {t('timeline.currentStage')}: <span className="font-medium text-zinc-900">{currentStage.name}</span>
          </p>
        )}
        <ul className="relative space-y-0">
          {events.length === 0 ? (
            <li className="py-4 text-sm text-zinc-500">{t('timeline.noEvents')}</li>
          ) : (
            events.map((ev, i) => (
              <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < events.length - 1 && (
                  <span className="absolute left-[7px] top-5 h-full w-px bg-zinc-200" />
                )}
                <span className="relative z-10 mt-0.5 h-3 w-3 shrink-0 rounded-full bg-indigo-500" />
                <div className="min-w-0 flex-1 pt-0">
                  <p className="text-sm font-medium text-zinc-900">{ev.label}</p>
                  {ev.detail && <p className="mt-0.5 text-xs text-zinc-500">{ev.detail}</p>}
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(ev.at).toLocaleString(locale === 'es' ? 'es' : 'en', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export function LeadDetail({
  lead,
  stages,
  tasks,
  tenantUsers,
  role: _role,
  canAssign,
  canEdit,
}: {
  lead: Lead;
  stages: Stage[];
  tasks: Task[];
  tenantUsers: User[];
  role: string;
  canAssign: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [tab, setTab] = useState<(typeof TABS)[number]>('details');
  const [stageId, setStageId] = useState(lead.stage_id ?? '');
  const [assignId, setAssignId] = useState(lead.assigned_to_user_id ?? '');
  const [updating, setUpdating] = useState(false);

  const handleStageChange = async (newStageId: string) => {
    if (!canEdit) return;
    setUpdating(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: newStageId || null }),
    });
    setUpdating(false);
    if (res.ok) {
      setStageId(newStageId);
      router.refresh();
    }
  };

  const handleAssignChange = async (userId: string) => {
    if (!canAssign) return;
    setUpdating(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to_user_id: userId || null }),
    });
    setUpdating(false);
    if (res.ok) {
      setAssignId(userId);
      router.refresh();
    }
  };

  const assignedTo = tenantUsers.find((u) => u.id === lead.assigned_to_user_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/leads" className="text-sm text-indigo-600 hover:underline">
            ← {t('detail.backToLeads')}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">{lead.name || t('common.noName')}</h1>
          {lead.email && <p className="text-sm text-zinc-500">{lead.email}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && stages.length > 0 && (
            <select
              value={stageId}
              onChange={(e) => handleStageChange(e.target.value)}
              disabled={updating}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900"
            >
              <option value="">{t('common.noStage')}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {canAssign && tenantUsers.length > 0 && (
            <select
              value={assignId}
              onChange={(e) => handleAssignChange(e.target.value)}
              disabled={updating}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900"
            >
              <option value="">{t('common.unassigned')}</option>
              {tenantUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
          )}
          {canEdit && (
            <Link
              href={`/dashboard/tareas/nuevo?leadId=${lead.id}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('detail.newTask')}
            </Link>
          )}
        </div>
      </div>

      <div className="border-b border-zinc-200">
        <nav className="flex gap-6">
          {TABS.map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={`border-b-2 py-3 text-sm font-medium ${
                tab === tabKey
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              {tabKey === 'details' && t('detail.details')}
              {tabKey === 'activities' && t('detail.activities')}
              {tabKey === 'related' && t('detail.related')}
              {tabKey === 'timeline' && t('detail.timeline')}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'details' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">{t('leads.name')}</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">{t('leads.email')}</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">{t('detail.phone')}</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">{t('leads.origin')}</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.origin || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">{t('leads.stage')}</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">
                {stages.find((s) => s.id === lead.stage_id)?.name ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">{t('leads.assignedTo')}</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{assignedTo ? (assignedTo.name || assignedTo.email) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">{t('detail.created')}</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">
                {new Date(lead.created_at).toLocaleString(locale === 'es' ? 'es' : 'en')}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {tab === 'activities' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">{t('detail.tasksTitle')}</h3>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{t('detail.noTasks')}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                  <span className={`text-sm ${task.done ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>{task.title}</span>
                  {task.due_at && (
                    <span className="text-xs text-zinc-500">{new Date(task.due_at).toLocaleDateString(locale === 'es' ? 'es' : 'en')}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <Link
              href={`/dashboard/tareas/nuevo?leadId=${lead.id}`}
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              + {t('detail.addTask')}
            </Link>
          )}
        </div>
      )}

      {tab === 'related' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">{t('detail.relatedComingSoon')}</p>
        </div>
      )}

      {tab === 'timeline' && (
        <TimelineTab lead={lead} stages={stages} tasks={tasks} t={t} locale={locale} />
      )}
    </div>
  );
}
