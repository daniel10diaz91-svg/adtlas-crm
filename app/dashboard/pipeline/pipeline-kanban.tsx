'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  getSlaStatusFromLead,
  getSlaLabel,
  slaColors,
  slaTooltips,
  slaTooltipMessageRed,
  type LastMessageForSla,
} from '@/lib/sla';
import { useLanguage } from '@/components/LanguageProvider';

type Stage = { id: string; name: string; order: number };
type Lead = { id: string; name: string | null; email: string | null; stage_id: string | null; created_at?: string };

function LeadCard({
  lead,
  lastMessage,
  isDragOverlay,
  stages,
  firstStageId,
  onStageChange,
  noNameLabel,
}: {
  lead: Lead;
  lastMessage?: LastMessageForSla | null;
  isDragOverlay?: boolean;
  stages?: Stage[];
  firstStageId?: string;
  onStageChange?: (leadId: string, stageId: string) => void;
  noNameLabel: string;
}) {
  const sla = lead.created_at
    ? getSlaStatusFromLead(lead, lastMessage)
    : null;
  const isRedFromMessage =
    sla === 'red' &&
    lastMessage &&
    lastMessage.type === 'inbound' &&
    !lastMessage.is_read;
  const slaTitle = sla
    ? isRedFromMessage
      ? slaTooltipMessageRed
      : `${getSlaLabel(lead.created_at!)} — ${slaTooltips[sla]}`
    : '';

  return (
    <div
      className={`rounded-lg border bg-white p-3 text-sm shadow-sm ${
        isDragOverlay ? 'border-indigo-300 shadow-md' : 'border-zinc-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-medium text-zinc-900">
          <Link href={`/dashboard/leads/${lead.id}`} className="text-indigo-600 hover:underline">
            {lead.name || noNameLabel}
          </Link>
        </p>
        {sla && (
          <span
            className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${slaColors[sla]}`}
            title={slaTitle}
          />
        )}
      </div>
      {lead.email && <p className="mt-0.5 truncate text-zinc-500">{lead.email}</p>}
      {!isDragOverlay && stages && firstStageId && onStageChange && (
        <select
          className="mt-2 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm font-medium text-zinc-900"
          value={lead.stage_id || firstStageId || ''}
          onChange={(e) => onStageChange(lead.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function DraggableLeadCard({
  lead,
  lastMessage,
  stageId,
  stages,
  firstStageId,
  onStageChange,
  noNameLabel,
}: {
  lead: Lead;
  lastMessage?: LastMessageForSla | null;
  stageId: string;
  stages: Stage[];
  firstStageId: string;
  onStageChange: (leadId: string, stageId: string) => void;
  noNameLabel: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { lead, stageId },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-50' : ''}
    >
      <LeadCard
        lead={lead}
        lastMessage={lastMessage}
        stages={stages}
        firstStageId={firstStageId}
        onStageChange={onStageChange}
        noNameLabel={noNameLabel}
      />
    </div>
  );
}

function DroppableColumn({
  stage,
  firstStageId,
  getLeadsForStage,
  stages,
  moveLead,
  noNameLabel,
  lastMessageByLeadId,
}: {
  stage: Stage;
  leads: Lead[];
  firstStageId: string;
  getLeadsForStage: (stageId: string) => Lead[];
  moveLead: (leadId: string, stageId: string) => void;
  stages: Stage[];
  noNameLabel: string;
  lastMessageByLeadId: Record<string, LastMessageForSla>;
}) {
  const stageLeads = getLeadsForStage(stage.id);
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] shrink-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors ${
        isOver ? 'border-indigo-300 bg-indigo-50/50' : 'bg-zinc-50/50'
      }`}
    >
      <h2 className="font-medium text-zinc-900">{stage.name}</h2>
      <p className="text-sm text-zinc-500">{stageLeads.length} leads</p>
      <ul className="mt-3 space-y-2">
        {stageLeads.map((lead) => (
          <li key={lead.id}>
            <DraggableLeadCard
              lead={lead}
              lastMessage={lastMessageByLeadId[lead.id]}
              stageId={stage.id}
              stages={stages}
              firstStageId={firstStageId}
              onStageChange={moveLead}
              noNameLabel={noNameLabel}
            />
          </li>
        ))}
        {stageLeads.length > 10 && (
          <li className="py-1 text-center text-sm text-zinc-400">
            +{stageLeads.length - 10} more
          </li>
        )}
      </ul>
    </div>
  );
}

type LastMessageByLeadId = Record<string, LastMessageForSla>;

export function PipelineKanban({
  stages,
  leads: initialLeads,
  lastMessageByLeadId = {},
}: {
  stages: Stage[];
  leads: Lead[];
  lastMessageByLeadId?: LastMessageByLeadId;
}) {
  const { t } = useLanguage();
  const noNameLabel = t('common.noName');
  const firstStageId = stages[0]?.id;

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [moveError, setMoveError] = useState<string | null>(null);

  const getLeadsForStage = (stageId: string) =>
    leads.filter(
      (l) => l.stage_id === stageId || (stageId === firstStageId && !l.stage_id)
    );

  async function moveLead(leadId: string, stageId: string): Promise<boolean> {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMoveError(data?.error ?? 'Error al mover');
      return false;
    }
    setMoveError(null);
    return true;
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLead = activeId?.startsWith('lead-')
    ? leads.find((l) => `lead-${l.id}` === activeId)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
    setMoveError(null);
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    if (!activeIdStr.startsWith('lead-')) return;
    const leadId = activeIdStr.slice(5);
    let newStageId: string | null = null;
    if (overIdStr.startsWith('stage-')) {
      newStageId = overIdStr.slice(7);
    } else if (overIdStr.startsWith('lead-')) {
      const overLead = leads.find((l) => `lead-${l.id}` === overIdStr);
      newStageId = overLead?.stage_id ?? firstStageId ?? null;
    }
    if (!newStageId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage_id === newStageId) return;

    const prevLeads = [...leads];
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, stage_id: newStageId } : l
      )
    );

    const ok = await moveLead(leadId, newStageId);
    if (!ok) setLeads(prevLeads);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {moveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {moveError}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <DroppableColumn
            key={stage.id}
            stage={stage}
            leads={leads}
            firstStageId={firstStageId ?? ''}
            getLeadsForStage={getLeadsForStage}
            moveLead={moveLead}
            stages={stages}
            noNameLabel={noNameLabel}
            lastMessageByLeadId={lastMessageByLeadId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <LeadCard
            lead={activeLead}
            lastMessage={lastMessageByLeadId[activeLead.id]}
            isDragOverlay
            noNameLabel={noNameLabel}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
