interface CardsDueWidgetProps {
  due: number;
  done: number;
}

export default function CardsDueWidget({ due, done }: CardsDueWidgetProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--surface-raised)] px-5 w-24 h-24">
      <span className="text-2xl font-bold text-[var(--text-primary)] leading-none">{due}</span>
      <span className="text-xs text-[var(--text-tertiary)] text-center leading-tight">cards<br />due today</span>
      <div className="mt-1 w-full rounded-full h-1 bg-[color-mix(in_oklch,var(--primary)_20%,transparent)]">
        <div
          className="h-1 rounded-full bg-[var(--primary)]"
          style={{ width: `${(done / due) * 100}%` }}
        />
      </div>
    </div>
  );
}
