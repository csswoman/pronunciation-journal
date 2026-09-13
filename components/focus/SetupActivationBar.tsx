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
 * Resumen de selección y botón principal de activación del sprint.
 */
export function SetupActivationBar({
  selectedGaps,
  isActivating,
  stageLabel,
  errorMessage,
  onActivate,
}: SetupActivationBarProps) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-col gap-3">
      {errorMessage && (
        <div className="rounded-lg border border-error-soft bg-error-soft p-3 text-body-sm text-error shadow-xs">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border-default bg-surface-raised p-4 shadow-md">
        <div className="min-w-0">
          <span className="block text-body-sm font-semibold text-fg">
            {selectedGaps.length} de 2 focos seleccionados
          </span>
          <span className="block truncate text-tiny text-fg-subtle">
            {selectedGaps.map((g) => g.label).join(' · ') || 'Elige al menos 1 foco para comenzar tu sprint'}
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

