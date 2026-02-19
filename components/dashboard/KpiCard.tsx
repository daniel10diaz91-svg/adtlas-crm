type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
    </div>
  );
}
