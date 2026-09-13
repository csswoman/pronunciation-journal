import { useState } from 'react'
import { FluencyRadarCard } from '@/components/progress/FluencyRadarCard'
import { useFluencyPreview } from '@/hooks/useFluencyPreview'
import { Radar, ChevronDown, ChevronUp } from '@/components/icons'

interface SkillsRadarPreviewProps {
  enabled: boolean
}

/**
 * Reutiliza el radar de 6 dimensiones de /progress.
 * Se presenta colapsado por defecto con un disparador compacto para
 * no desplazar los focos de estudio fuera del pliegue superior.
 */
export function SkillsRadarPreview({ enabled }: SkillsRadarPreviewProps) {
  const { preview, isLoading } = useFluencyPreview(enabled)
  const [isOpen, setIsOpen] = useState(false)

  if (!enabled || isLoading || !preview?.scores) return null

  return (
    <div className="mb-6 rounded-xl border border-border-default bg-surface-raised transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="focus-ring flex w-full items-center justify-between gap-3 p-3.5 text-left rounded-xl transition-colors hover:bg-surface-sunken"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Radar className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="block text-body-sm font-semibold text-fg">
              Tu perfil de fluidez actual
            </span>
            <span className="block truncate text-tiny text-fg-subtle">
              {isOpen ? 'Ocultar diagnóstico de 6 áreas' : 'Ver radar de fortalezas y áreas de oportunidad'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-tiny font-medium text-primary shrink-0">
          <span>{isOpen ? 'Ocultar' : 'Ver radar'}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-primary" aria-hidden="true" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border-subtle p-4">
          <FluencyRadarCard scores={preview.scores} comparisonLabel={preview.comparisonLabel} />
        </div>
      )}
    </div>
  )
}
