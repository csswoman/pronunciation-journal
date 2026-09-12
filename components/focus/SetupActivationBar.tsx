import Button from '@/components/ui/Button'
import type { SprintGap } from '@/lib/focus/types'

interface SetupActivationBarProps {
  selectedGaps: SprintGap[]
  isActivating: boolean
  stageLabel: string | null
  errorMessage: string | null
  onActivate: () => void
}

/**
 * Resumen de selección + CTA de activación. Separado del árbol de selección
 * para que el estado de carga (etapas de useSprintActivation) no fuerce un
 * re-render de toda la pantalla de picking.
 */
export function SetupActivationBar({
  selectedGaps,
  isActivating,
  stageLabel,
  errorMessage,
  onActivate,
}: SetupActivationBarProps) {
  return (
    <div className="sticky bottom-4 flex flex-col gap-3">
      {errorMessage && (
        <div className="p-3 rounded-lg bg-[var(--badge-error-bg)] text-[var(--text-error)] text-body-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] shadow-md">
        <div className="min-w-0">
          <span className="text-body-sm font-semibold text-[var(--text-primary)] block">
            {selectedGaps.length} de 2 seleccionados
          </span>
          <span className="text-tiny text-[var(--text-tertiary)] block truncate">
            {selectedGaps.map((g) => g.label).join(' · ') || 'Elige al menos 1 tema'}
          </span>
        </div>
        <Button
          variant="primary"
          onClick={onActivate}
          disabled={selectedGaps.length === 0 || isActivating}
          isLoading={isActivating}
        >
          {stageLabel ?? 'Activar sprint'}
        </Button>
      </div>
    </div>
  )
}
