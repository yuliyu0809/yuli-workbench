export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-ink text-white shadow-soft hover:bg-[#473f43]',
    soft: 'border border-white/70 bg-white/70 text-ink hover:bg-white',
    blush: 'bg-[#f4c9d8] text-[#563441] hover:bg-[#efb8cc]',
    ghost: 'text-muted hover:bg-white/60 hover:text-ink',
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
