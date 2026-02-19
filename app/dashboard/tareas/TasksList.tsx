'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Task = {
  id: string;
  title: string;
  due_at: string | null;
  done: boolean;
  lead_id: string | null;
};

export function TasksList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const filtered =
    filter === 'today'
      ? tasks.filter((t) => {
          if (!t.due_at) return false;
          const d = new Date(t.due_at);
          return d >= todayStart && d < todayEnd && !t.done;
        })
      : filter === 'upcoming'
        ? tasks.filter((t) => {
            if (!t.due_at) return false;
            return new Date(t.due_at) >= todayEnd && !t.done;
          })
        : tasks;

  async function toggleDone(id: string, done: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    router.refresh();
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['today', 'upcoming', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <p className="font-medium text-zinc-900">
              {filter === 'today' && 'No tasks due today'}
              {filter === 'upcoming' && 'No upcoming tasks'}
              {filter === 'all' && 'No tasks yet'}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Tasks you create from leads will show here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-50/50"
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleDone(t.id, !t.done)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
                />
                <span
                  className={`flex-1 ${t.done ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}
                >
                  {t.title}
                </span>
                {t.due_at && (
                  <span className="text-sm text-zinc-500">{formatDate(t.due_at)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
