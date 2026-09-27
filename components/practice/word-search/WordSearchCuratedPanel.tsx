'use client'

// Planned structure:
// <WordSearchCuratedPanel>
//   <InsetContainer>
//     <PanelHeader title="Temas fonéticos curados" />
//     <PresetCardGrid />
//   </InsetContainer>
//   <ActionRow buttonCTA textNote />
// </WordSearchCuratedPanel>

import { WORD_SEARCH_PRESETS } from '@/lib/exercises/word-search/presets'
import Button from '@/components/ui/Button'
import { ArrowRight } from '@/components/icons'

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
      <div className="rounded-2xl bg-surface-sunken p-4 sm:p-5 flex flex-col gap-3.5 border border-border-subtle">
        <h3 className="font-heading text-body-md font-bold text-fg">Temas fonéticos curados</h3>

        <div
          className="grid gap-3 sm:grid-cols-2"
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
                className={`group focus-ring flex min-h-20 flex-col justify-between gap-2 rounded-2xl p-4 text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#12151c] bg-[#b9d3fb] text-[#12151c] shadow-xs'
                    : 'border-2 border-border-default bg-surface hover:border-border-strong text-fg'
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className={`font-heading text-body-md font-bold leading-snug ${isSelected ? 'text-[#12151c]' : 'text-fg'}`}>
                    {preset.title}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-tiny font-bold uppercase ${
                      isSelected
                        ? 'border border-[#12151c]/30 bg-black/10 text-[#12151c]'
                        : 'border border-border-subtle bg-surface-sunken text-fg-muted'
                    }`}
                  >
                    {LEVEL_LABELS[preset.level]}
                  </span>
                </div>
                <span className={`font-sans text-body-sm text-pretty ${isSelected ? 'text-[#4a5263]' : 'text-fg-muted'}`}>
                  {preset.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-soft p-3 text-body-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 pt-1">
        <Button
          variant="primary"
          className="h-14 px-7 text-base font-bold rounded-full gap-2 bg-[#2563eb] text-white hover:bg-[#1d4ed8] shrink-0"
          onClick={onStart}
        >
          <span>Comenzar partida</span>
          <ArrowRight size={18} aria-hidden />
        </Button>

        <span className="font-sans text-caption text-fg-muted">
          Al terminar podrás guardar las palabras en tu cuaderno.
        </span>
      </div>
    </div>
  )
}
