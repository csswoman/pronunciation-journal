// Planned structure:
// <SelectedGapsChips>
//   <CountLabel />
//   <GapChip /> × n        (quita el foco al hacer clic)
//   <EditButton />         (opcional: vuelve al paso de elegir)
// </SelectedGapsChips>

import { X } from '@/components/icons'
import type { SprintGap } from '@/lib/focus/types'

interface SelectedGapsChipsProps {
  gaps: SprintGap[]
  onRemove: (gap: SprintGap) => void
  /** Si se pasa, muestra "Cambiar" para volver a elegir focos. */
  onEdit?: () => void
}

/** Focos elegidos como chips removibles, con conteo sobre el máximo de 2. */
export function SelectedGapsChips({ gaps, onRemove, onEdit }: SelectedGapsChipsProps) {
  if (gaps.length === 0) return null

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5 rounded-2xl border border-border-default bg-surface-raised p-4 shadow-xs">
      <span className="ts-kicker text-fg-subtle">
        Focos seleccionados ({gaps.length}/2):
      </span>
      {gaps.map((gap) => (
        <button
          key={gap.targetId}
          type="button"
          onClick={() => onRemove(gap)}
          className="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cta-bg px-3.5 py-1 ts-chip text-cta-fg shadow-xs transition-opacity hover:opacity-90"
          title={`Quitar ${gap.label}`}
        >
          <span>{gap.label}</span>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="focus-ring ml-auto cursor-pointer ts-button text-primary underline hover:opacity-80"
        >
          Cambiar focos
        </button>
      )}
    </div>
  )
}
