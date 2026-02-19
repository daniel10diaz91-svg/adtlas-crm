'use client';

type DayCount = { date: string; count: number };

export function LeadsChart({ data }: { data: DayCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">Leads last 14 days</h3>
      <div className="mt-4 flex items-end gap-1.5">
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-indigo-500 transition-opacity hover:opacity-90"
              style={{ height: `${(d.count / max) * 80}px`, minHeight: d.count ? 4 : 0 }}
              title={`${d.date}: ${d.count}`}
            />
            <span className="text-[10px] text-zinc-400">
              {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
