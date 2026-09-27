// Planned structure:
// <MemoryStatsCard>
//   <div (Card Container)>
//     <span (Header Kicker)>
//     <div (Progress Track Bar)>
//     <div (Legend List: Dominadas | Aprendiendo | Por empezar)>
//     <p (Footnote Text)>
//   </div>
// </MemoryStatsCard>

interface MemoryStatsCardProps {
  masteredCount: number;
  learningCount: number;
  unstartedCount: number;
}

export function MemoryStatsCard({
  masteredCount,
  learningCount,
  unstartedCount,
}: MemoryStatsCardProps) {
  const total = masteredCount + learningCount + unstartedCount;
  const learningPct = total > 0 ? Math.max(3, Math.round((learningCount / total) * 100)) : 4;
  const masteredPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-surface-raised border border-border-subtle/80 p-5 shadow-2xs space-y-4">
      <h4 className="font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider">
        TU MEMORIA
      </h4>

      {/* Overall progress bar */}
      <div className="h-3.5 w-full rounded-full bg-surface-sunken overflow-hidden flex" aria-hidden>
        {masteredPct > 0 ? (
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${masteredPct}%` }} />
        ) : null}
        <div className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${learningPct}%` }} />
      </div>

      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-body-sm font-medium">
          <div className="flex items-center gap-2 text-fg-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Dominadas</span>
          </div>
          <span className="font-mono font-bold text-fg">{masteredCount}</span>
        </div>

        <div className="flex items-center justify-between text-body-sm font-medium">
          <div className="flex items-center gap-2 text-fg-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>Aprendiendo</span>
          </div>
          <span className="font-mono font-bold text-fg">{learningCount}</span>
        </div>

        <div className="flex items-center justify-between text-body-sm font-medium">
          <div className="flex items-center gap-2 text-fg-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-400 shrink-0" />
            <span>Por empezar</span>
          </div>
          <span className="font-mono font-bold text-fg">{unstartedCount}</span>
        </div>
      </div>

      <p className="text-caption text-fg-muted leading-relaxed border-t border-border-subtle/40 pt-3">
        Una tarjeta pasa a dominada cuando la aciertas con intervalos de 3 semanas o más.
      </p>
    </div>
  );
}
