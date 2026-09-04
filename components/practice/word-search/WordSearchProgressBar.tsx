'use client'

// Planned structure:
// <WordSearchProgressBar>
//   <ProgressInfoGroup />  (label, found counter / total)
//   <ProgressBarTrack>     (role="progressbar", animated fill)
// </WordSearchProgressBar>

interface Props {
  foundCount: number
  totalCount: number
  progressPercent: number
  isCompleted: boolean
}

export default function WordSearchProgressBar({
  foundCount,
  totalCount,
  progressPercent,
  isCompleted,
}: Props) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 shadow-xs sm:flex-row sm:items-center sm:gap-4"
      aria-label="Progreso de la partida"
    >
      <div className="flex items-center justify-between gap-3 text-caption text-fg-muted sm:min-w-44">
        <span className="flex items-center gap-1.5 font-medium text-fg">
          <span
            className={`h-2 w-2 rounded-full transition-colors duration-200 ${
              isCompleted ? 'bg-success' : 'bg-primary'
            }`}
            aria-hidden
          />
          {isCompleted ? 'Partida completada' : 'Palabras encontradas'}
        </span>
        <span className="font-mono font-semibold tabular-nums text-fg">
          {foundCount} / {totalCount}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Palabras encontradas"
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuenow={foundCount}
        className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out-quart motion-reduce:transition-none ${
            isCompleted ? 'bg-success' : 'bg-primary'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
