'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { createClient } from '@/lib/supabase/client';

type ConversationItem = {
  leadId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stageId: string | null;
  lastMessage: {
    content: string;
    created_at: string;
    type: string;
    is_read: boolean;
  } | null;
};

type MessageItem = {
  id: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

type LeadDetail = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stage_id: string | null;
  origin: string;
  created_at: string;
};

function ConversationsSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="h-10 w-10 rounded-full bg-zinc-300" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-32 rounded bg-zinc-300" />
            <div className="h-3 w-48 rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex animate-pulse ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
        >
          <div className="h-12 max-w-[70%] rounded-lg bg-zinc-200" style={{ width: 120 + i * 40 }} />
        </div>
      ))}
    </div>
  );
}

export default function InboxPage() {
  const { t, locale } = useLanguage();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [leadDetail, setLeadDetail] = useState<LeadDetail | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/inbox/conversations');
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (leadId: string) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const [msgRes, leadRes] = await Promise.all([
        fetch(`/api/inbox/leads/${leadId}/messages`),
        fetch(`/api/leads/${leadId}`),
      ]);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages ?? []);
      }
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeadDetail(leadData);
      }
      await fetch(`/api/inbox/leads/${leadId}/read`, { method: 'POST' });
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedLeadId) {
      setMessages([]);
      setLeadDetail(null);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      return;
    }
    fetchMessages(selectedLeadId);

    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-messages-${selectedLeadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedLeadId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; content: string; type: string; is_read: boolean; created_at: string };
          setMessages((prev) => [...prev, { id: row.id, content: row.content, type: row.type, is_read: row.is_read, created_at: row.created_at }]);
          fetchConversations();
        }
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [selectedLeadId, fetchMessages, fetchConversations]);

  const selectedConversation = conversations.find((c) => c.leadId === selectedLeadId);
  const dateOpts: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' };
  const localeStr = locale === 'es' ? 'es' : 'en';

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:h-[calc(100vh-6rem)]">
      <h1 className="mb-4 text-2xl font-semibold text-zinc-900">{t('inbox.title')}</h1>
      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Panel 1: Lista de conversaciones */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-4">
          <div className="border-b border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500">
            {t('inbox.lastMessage')}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingConversations ? (
              <ConversationsSkeleton />
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">{t('inbox.noConversations')}</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {conversations.map((c) => (
                  <li key={c.leadId}>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(c.leadId)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-50 ${
                        selectedLeadId === c.leadId ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600">
                        {(c.name || c.email || c.phone || '?').toString().slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900">
                          {c.name || c.email || c.phone || t('common.noName')}
                        </p>
                        {c.lastMessage && (
                          <p className="truncate text-sm text-zinc-500">
                            {c.lastMessage.content.slice(0, 50)}
                            {c.lastMessage.content.length > 50 ? '…' : ''}
                          </p>
                        )}
                      </div>
                      {c.lastMessage && (
                        <span className="shrink-0 text-xs text-zinc-400">
                          {new Date(c.lastMessage.created_at).toLocaleDateString(localeStr, dateOpts)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Panel 2: Feed de mensajes */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-5">
          {!selectedLeadId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-zinc-500">
              {t('inbox.selectLead')}
            </div>
          ) : loadingMessages ? (
            <MessagesSkeleton />
          ) : (
            <>
              <div className="border-b border-zinc-200 px-4 py-2 font-medium text-zinc-900">
                {selectedConversation?.name || selectedConversation?.email || selectedConversation?.phone || t('common.noName')}
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">{t('inbox.noConversations')}</p>
                ) : (
                  <ul className="space-y-2">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className={`flex ${m.type === 'outbound' || m.type === 'internal_note' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            m.type === 'outbound' || m.type === 'internal_note'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-100 text-zinc-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className="mt-1 text-xs opacity-80">
                            {new Date(m.created_at).toLocaleString(localeStr, dateOpts)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* Panel 3: Perfil del lead */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-3">
          <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500">
            {t('inbox.profile')}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedLeadId || !leadDetail ? (
              <p className="text-sm text-zinc-500">{t('inbox.selectLead')}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t('leads.name')}</p>
                  <p className="text-zinc-900">{leadDetail.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t('leads.email')}</p>
                  <p className="text-zinc-900">{leadDetail.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t('leads.phone')}</p>
                  <p className="text-zinc-900">{leadDetail.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t('leads.origin')}</p>
                  <p className="text-zinc-900">{leadDetail.origin || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t('leads.createdAt')}</p>
                  <p className="text-zinc-900">
                    {new Date(leadDetail.created_at).toLocaleDateString(localeStr, dateOpts)}
                  </p>
                </div>
                <Link
                  href={`/dashboard/leads/${leadDetail.id}`}
                  className="inline-block rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {t('inbox.viewFullLead')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
