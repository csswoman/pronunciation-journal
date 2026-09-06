'use client'

// Planned structure:
// <WordSearchCuratedPanel>
//   <PanelHeader />         (título y subtítulo explicativo de fonética)
//   <PresetCardGrid />      (rejilla de tarjetas seleccionables con estilo Inset Grouped)
//   <ActionContainer />     (botón primary para iniciar con el tema elegido)
// </WordSearchCuratedPanel>

import { WORD_SEARCH_PRESETS } from '@/lib/exercises/word-search/presets'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Volume2 } from '@/components/icons'

interface Props {
  selectedPresetId: string
  onSelectPresetId: (id: string) => void
  error: string | null
  onStart: () => void
}

const LEVEL_LABELS = {
  beginner: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
} as const

export default function WordSearchCuratedPanel({
  selectedPresetId,
  onSelectPresetId,
  error,
  onStart,
}: Props) {
  return (
    <div
      id="word-search-panel-curated"
      role="tabpanel"
      aria-labelledby="word-search-tab-curated"
      tabIndex={0}
      className="flex flex-col gap-4 focus:outline-none"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-h4 font-bold text-fg">Temas fonéticos curados</h3>
        </div>
        <p className="max-w-prose text-pretty text-body-sm text-fg-muted">
          Entrena patrones ortográficos críticos: letras mudas, contrastes vocálicos y combinaciones frecuentes.
        </p>
      </div>

      <div
        className="grid gap-2.5 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Selecciona un tema fonético"
      >
        {WORD_SEARCH_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectPresetId(preset.id)}
              className={`focus-ring flex min-h-24 flex-col justify-between gap-2 rounded-xl border p-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none ${
                isSelected
                  ? 'border-primary bg-primary-soft shadow-xs ring-1 ring-primary/30'
                  : 'border-border-subtle bg-surface-raised hover:border-border-default hover:bg-surface-sunken'
              }`}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="text-label font-bold text-fg">{preset.title}</span>
                <Badge label={LEVEL_LABELS[preset.level]} variant="neutral" />
              </div>
              <span className="text-pretty text-caption text-fg-muted">
                {preset.description}
              </span>
            </button>
          )
        })}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-soft p-3 text-body-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end pt-1">
        <Button variant="primary" className="w-full sm:w-auto" onClick={onStart}>
          Crear tablero fonético
        </Button>
      </div>
    </div>
  )
}
