'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { getSlaStatus, getSlaLabel, slaColors, slaTooltips } from '@/lib/sla';
import { useLanguage } from '@/components/LanguageProvider';

type Stage = { id: string; name: string; order: number };
type Lead = { id: string; name: string | null; email: string | null; stage_id: string | null; created_at?: string };

function LeadCard({
  lead,
  isDragOverlay,
  stages,
  firstStageId,
  onStageChange,
  noNameLabel,
}: {
  lead: Lead;
  isDragOverlay?: boolean;
  stages?: Stage[];
  firstStageId?: string;
  onStageChange?: (leadId: string, stageId: string) => void;
  noNameLabel: string;
}) {
  const sla = lead.created_at ? getSlaStatus(lead.created_at) : null;

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
            title={`${getSlaLabel(lead.created_at!)} — ${slaTooltips[sla]}`}
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
  stageId,
  stages,
  firstStageId,
  onStageChange,
  noNameLabel,
}: {
  lead: Lead;
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
}: {
  stage: Stage;
  leads: Lead[];
  firstStageId: string;
  getLeadsForStage: (stageId: string) => Lead[];
  moveLead: (leadId: string, stageId: string) => void;
  stages: Stage[];
  noNameLabel: string;
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

export function PipelineKanban({ stages, leads }: { stages: Stage[]; leads: Lead[] }) {
  const router = useRouter();
  const { t } = useLanguage();
  const noNameLabel = t('common.noName');
  const firstStageId = stages[0]?.id;

  const getLeadsForStage = (stageId: string) =>
    leads.filter(
      (l) => l.stage_id === stageId || (stageId === firstStageId && !l.stage_id)
    );

  async function moveLead(leadId: string, stageId: string) {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId }),
    });
    router.refresh();
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
  }

  function handleDragEnd(e: DragEndEvent) {
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
    if (newStageId) moveLead(leadId, newStageId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragOverlay noNameLabel={noNameLabel} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
