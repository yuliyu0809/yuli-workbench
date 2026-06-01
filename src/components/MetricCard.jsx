export function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/62 p-4 shadow-soft backdrop-blur-xl">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <strong className="text-3xl font-semibold text-ink">{value}</strong>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
    </div>
  );
}
