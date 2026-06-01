export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-5">
      <div>
        <div className="text-sm font-medium text-[#b56b86]">{eyebrow}</div>
        <h2 className="mt-2 text-4xl font-semibold text-ink">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
