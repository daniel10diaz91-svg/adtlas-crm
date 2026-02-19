'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

function buildTimelineEvents(lead: Lead, stages: Stage[], tasks: Task[]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: 'created',
      at: lead.created_at,
      type: 'created',
      label: 'Lead creado',
      detail: lead.origin ? `Origen: ${lead.origin}` : undefined,
    },
  ];
  tasks.forEach((t) => {
    if (t.created_at) {
      events.push({
        id: t.id,
        at: t.created_at,
        type: 'task',
        label: t.done ? `Tarea completada: ${t.title}` : `Tarea: ${t.title}`,
        detail: t.due_at ? `Vencimiento: ${new Date(t.due_at).toLocaleDateString('es')}` : undefined,
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
}: {
  lead: Lead;
  stages: Stage[];
  tasks: Task[];
}) {
  const events = buildTimelineEvents(lead, stages, tasks);
  const currentStage = stages.find((s) => s.id === lead.stage_id);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-0">
        {currentStage && (
          <p className="mb-4 text-sm text-zinc-600">
            Etapa actual: <span className="font-medium text-zinc-900">{currentStage.name}</span>
          </p>
        )}
        <ul className="relative space-y-0">
          {events.length === 0 ? (
            <li className="py-4 text-sm text-zinc-500">Sin eventos aún.</li>
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
                    {new Date(ev.at).toLocaleString('es', {
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
            ← Volver a leads
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">{lead.name || 'Sin nombre'}</h1>
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
              <option value="">Sin etapa</option>
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
              <option value="">Sin asignar</option>
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
              Nueva tarea
            </Link>
          )}
        </div>
      </div>

      <div className="border-b border-zinc-200">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 py-3 text-sm font-medium ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              {t === 'details' && 'Detalles'}
              {t === 'activities' && 'Actividades'}
              {t === 'related' && 'Relacionados'}
              {t === 'timeline' && 'Timeline'}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'details' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Nombre</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Email</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Teléfono</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Origen</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{lead.origin || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Etapa</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">
                {stages.find((s) => s.id === lead.stage_id)?.name ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Asignado a</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{assignedTo ? (assignedTo.name || assignedTo.email) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Creado</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">
                {new Date(lead.created_at).toLocaleString('es')}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {tab === 'activities' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Tareas</h3>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No hay tareas.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                  <span className={`text-sm ${t.done ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>{t.title}</span>
                  {t.due_at && (
                    <span className="text-xs text-zinc-500">{new Date(t.due_at).toLocaleDateString('es')}</span>
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
              + Añadir tarea
            </Link>
          )}
        </div>
      )}

      {tab === 'related' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Oportunidades y casos relacionados (próximamente).</p>
        </div>
      )}

      {tab === 'timeline' && (
        <TimelineTab lead={lead} stages={stages} tasks={tasks} />
      )}
    </div>
  );
}
