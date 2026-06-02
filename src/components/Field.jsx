export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`h-11 w-full rounded-xl border border-white/70 bg-white/72 px-3 text-sm text-ink outline-none transition placeholder:text-[#b9aab0] focus:border-[#e9aabe] focus:bg-white focus:ring-4 focus:ring-[#f7dce7] ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`min-h-28 w-full resize-none rounded-xl border border-white/70 bg-white/72 px-3 py-3 text-sm text-ink outline-none transition placeholder:text-[#b9aab0] focus:border-[#e9aabe] focus:bg-white focus:ring-4 focus:ring-[#f7dce7] ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', ...props }) {
  return (
    <select
      className={`h-11 w-full rounded-xl border border-white/70 bg-white/72 px-3 text-sm text-ink outline-none transition focus:border-[#e9aabe] focus:bg-white focus:ring-4 focus:ring-[#f7dce7] ${className}`}
      {...props}
    />
  );
}
