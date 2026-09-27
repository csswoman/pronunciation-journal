'use client'

// Planned structure:
// <WordSearchGeminiPanel>
//   <InsetContainer>
//     <PanelHeader title="Reto a medida con IA" />
//     <TopicInputGroup />
//     <LevelPicker />
//   </InsetContainer>
//   <ActionRow buttonCTA textNote />
// </WordSearchGeminiPanel>

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowRight } from '@/components/icons'

interface Props {
  customTopic: string
  onCustomTopicChange: (topic: string) => void
  customLevel: 'beginner' | 'intermediate' | 'advanced'
  onCustomLevelChange: (level: 'beginner' | 'intermediate' | 'advanced') => void
  isGenerating: boolean
  error: string | null
  onGenerate: () => void
}

const LEVEL_LABELS = {
  beginner: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
} as const

export default function WordSearchGeminiPanel({
  customTopic,
  onCustomTopicChange,
  customLevel,
  onCustomLevelChange,
  isGenerating,
  error,
  onGenerate,
}: Props) {
  return (
    <div
      id="word-search-panel-gemini"
      role="tabpanel"
      aria-labelledby="word-search-tab-gemini"
      tabIndex={0}
      className="flex flex-col gap-4 focus:outline-none"
    >
      <div className="rounded-2xl bg-surface-sunken p-4 sm:p-5 flex flex-col gap-4 border border-border-subtle">
        <h3 className="font-heading text-body-md font-bold text-fg">Reto a medida con IA</h3>

        <Input
          label="Tema o situación de práctica"
          value={customTopic}
          onChange={onCustomTopicChange}
          placeholder="Ej.: Entrevistas de software, pedir un café o viajar"
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="font-sans text-body-xs font-bold text-fg">Nivel del vocabulario</legend>
          <div
            role="radiogroup"
            aria-label="Nivel del vocabulario para la IA"
            className="grid grid-cols-3 gap-1.5 rounded-xl border border-border-subtle bg-surface p-1.5"
          >
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
              const isSelected = customLevel === level
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onCustomLevelChange(level)}
                  className={`focus-ring flex h-11 items-center justify-center rounded-lg px-3 py-2 font-sans text-caption font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#b9d3fb] text-[#12151c] border-2 border-[#12151c] dark:bg-primary dark:text-on-primary dark:border-primary shadow-xs'
                      : 'border border-transparent text-fg-muted hover:bg-surface-sunken hover:text-fg'
                  }`}
                >
                  {LEVEL_LABELS[level]}
                </button>
              )
            })}
          </div>
        </fieldset>
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
          isLoading={isGenerating}
          onClick={onGenerate}
        >
          <span>{isGenerating ? 'Generando palabras con IA…' : 'Comenzar partida'}</span>
          {!isGenerating && <ArrowRight size={18} aria-hidden />}
        </Button>

        <span className="font-sans text-caption text-fg-muted">
          Al terminar podrás guardar las palabras en tu cuaderno.
        </span>
      </div>
    </div>
  )
}
