interface Props {
  current: number;
  total: number;
  mastered: number;
  pct: number;
}

export default function ProgressBar({ current, total, mastered, pct }: Props) {
  const safePct = Math.min(Math.max(pct, 0), 100);

  return (
    <div className="shrink-0 px-5 pt-3 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium tabular-nums text-fg-subtle">
          Phrase {current} / {total}
        </span>
        {mastered > 0 && (
          <span className="text-[11px] font-medium text-success">
            {mastered} mastered
          </span>
        )}
      </div>
      <div
        className="relative w-full h-1 rounded-full overflow-hidden bg-surface-sunken"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${safePct}%`,
            background: "linear-gradient(90deg, var(--primary-300), var(--primary))",
          }}
        />
      </div>
    </div>
  );
}
