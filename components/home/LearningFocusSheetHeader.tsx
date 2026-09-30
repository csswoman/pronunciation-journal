'use client'

// Planned structure:
// <LearningFocusSheetHeader>
//   <title row with close button />
//   <description />
//   <level pills selector />
//   <progress summary and bar />
// </LearningFocusSheetHeader>

import type { CefrLevelId } from '@/lib/courses/types'
import { X } from '@/components/icons'
import { cn } from '@/lib/cn'
import { ALL_LEVELS } from './learningFocusSheetHelpers'

type LearningFocusSheetHeaderProps = {
  activeLevel: CefrLevelId
  onSelectLevel: (level: CefrLevelId) => void
  claimedCount: number
  totalCount: number
  newSelectedCount: number
  claimedPercent: number
  newPercent: number
  onClose: () => void
}

export function LearningFocusSheetHeader({
  activeLevel,
  onSelectLevel,
  claimedCount,
  totalCount,
  newSelectedCount,
  claimedPercent,
  newPercent,
  onClose,
}: LearningFocusSheetHeaderProps) {
  return (
    <div className="flex flex-col border-b border-border-subtle p-6 pb-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <h2
          id="focus-topics-title"
          className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          Temas que ya sé
        </h2>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-raised text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <p className="mt-2.5 text-body-sm leading-relaxed text-fg-muted">
        Marca lo que ya usas sin pensarlo. Lo quitamos de tu plan y volverá de vez en cuando en los
        repasos, para que no se olvide.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {ALL_LEVELS.map((lvl) => {
          const active = lvl.id === activeLevel
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onSelectLevel(lvl.id)}
              className={cn(
                'rounded-full px-4.5 py-1.5 text-caption font-semibold transition-colors',
                active
                  ? 'border border-(--accent-pink)/40 bg-(--accent-pink)/15 text-(--accent-pink)'
                  : 'border border-border-subtle bg-surface-raised text-fg-muted hover:bg-surface-sunken hover:text-fg',
              )}
            >
              {lvl.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between text-body-sm font-semibold">
          <span className="text-fg">
            {claimedCount} de {totalCount} temas de {activeLevel.toUpperCase()}
          </span>
          {newSelectedCount > 0 ? (
            <span className="text-(--accent-pink)">+{newSelectedCount} nuevos</span>
          ) : null}
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-border-subtle/50">
          <div
            className="h-full bg-fg transition-all duration-300"
            style={{ width: `${claimedPercent}%` }}
          />
          <div
            className="h-full bg-(--accent-pink) transition-all duration-300"
            style={{ width: `${newPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
