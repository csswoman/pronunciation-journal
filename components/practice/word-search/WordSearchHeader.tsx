'use client'

// Planned structure:
// <WordSearchHeader>
//   <HeaderLeftGroup>
//     <TopicIconBadge />
//     <TopicTitleGroup />
//     <ModeBadge />
//     <ProgressCounterGroup />
//     <ProgressBarTrack />
//   </HeaderLeftGroup>
//   <HeaderRightActions>
//     <TimerBadge />
//     <RestartButton />
//     <ExitButton />
//   </HeaderRightActions>
// </WordSearchHeader>

import type { WordSearchMode } from '@/lib/exercises/word-search/types'
import { WORD_SEARCH_MODE_LABELS } from '@/lib/exercises/word-search/mode-labels'
import { PillButton } from '@/components/ui/PillButton'
import { RotateCcw, Timer as TimerIcon, X, LayoutGrid } from '@/components/icons'

interface Props {
  title: string
  mode: WordSearchMode
  foundCount: number
  totalCount: number
  progressPercent: number
  elapsedSeconds: number
  formatTime: (seconds: number) => string
  onRestart: () => void
  onExit: () => void
  isCompleted?: boolean
}

export default function WordSearchHeader({
  title,
  mode,
  foundCount,
  totalCount,
  progressPercent,
  elapsedSeconds,
  formatTime,
  onRestart,
  onExit,
  isCompleted = false,
}: Props) {
  const modeLabel = WORD_SEARCH_MODE_LABELS[mode]

  return (
    <header className="flex w-full flex-col gap-3 rounded-2xl border border-border-subtle/90 bg-surface-raised p-3.5 sm:px-6 sm:py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/25 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/30">
          <LayoutGrid className="h-5 w-5" aria-hidden />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="text-body-md sm:text-body-lg font-extrabold text-fg truncate" title={title}>
            {title}
          </h1>

          <span className="inline-flex items-center rounded-full bg-surface-sunken border border-border-subtle/60 px-3 py-0.5 text-caption font-semibold text-fg-muted">
            {modeLabel}
          </span>

          <span className="font-mono text-caption font-bold tabular-nums text-fg">
            {foundCount} de {totalCount}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Progreso de la partida"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={foundCount}
          className="hidden h-2.5 flex-1 max-w-[12rem] min-w-[6rem] overflow-hidden rounded-full bg-surface-sunken border border-border-subtle/40 sm:block"
        >
          <div
            className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500 transition-[width] duration-300 ease-out-quart motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-sunken border border-border-subtle/60 px-3.5 font-mono text-caption font-semibold tabular-nums text-fg-muted"
          aria-label={isCompleted ? `Terminado en ${formatTime(elapsedSeconds)}` : `Tiempo transcurrido: ${formatTime(elapsedSeconds)}`}
        >
          {isCompleted ? (
            <span>Terminado · {formatTime(elapsedSeconds)}</span>
          ) : (
            <>
              <TimerIcon className="h-4 w-4 text-fg-subtle" aria-hidden />
              {formatTime(elapsedSeconds)}
            </>
          )}
        </span>

        <div className="flex items-center gap-2">
          <PillButton
            variant="outline"
            size="sm"
            className="min-h-9 min-w-9 rounded-full px-0 hover:bg-surface-sunken"
            onClick={onRestart}
            aria-label="Reiniciar este tablero"
            title="Reiniciar este tablero"
            icon={<RotateCcw className="h-4 w-4" aria-hidden />}
          />
          <PillButton
            variant="quiet"
            size="sm"
            className="min-h-9 min-w-9 rounded-full px-0 hover:bg-surface-sunken"
            onClick={onExit}
            aria-label="Salir de la partida"
            title="Salir de la partida"
            icon={<X className="h-4 w-4" aria-hidden />}
          />
        </div>
      </div>
    </header>
  )
}
