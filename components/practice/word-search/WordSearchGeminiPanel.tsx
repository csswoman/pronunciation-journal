'use client'

// Planned structure:
// <WordSearchGeminiPanel>
//   <PanelHeader />         (título y contexto de IA)
//   <TopicInputGroup />     (campo de texto con sugerencias)
//   <LevelPicker />         (segmented control de nivel básico/intermedio/avanzado)
//   <GenerateAction />      (botón de generación con spinner accesible)
// </WordSearchGeminiPanel>

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Sparkles } from '@/components/icons'

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
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs focus:outline-none sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-h4 font-bold text-fg">Reto a medida con IA</h3>
        </div>
        <p className="max-w-prose text-pretty text-body-sm text-fg-muted">
          Describe una temática profesional o cotidiana. Gemini creará seis palabras conectadas, con pistas y transcripción fonética.
        </p>
      </div>

      <Input
        label="Tema o situación de práctica"
        value={customTopic}
        onChange={onCustomTopicChange}
        placeholder="Ej.: Entrevistas de software, pedir un café o viajar en metro"
      />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-label font-semibold text-fg">Nivel del vocabulario</legend>
        <div
          role="radiogroup"
          aria-label="Nivel del vocabulario para la IA"
          className="grid grid-cols-3 gap-1 rounded-xl border border-border-subtle bg-surface-sunken p-1"
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
                className={`focus-ring min-h-11 rounded-lg px-2 py-1.5 text-caption font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none sm:text-body-sm ${
                  isSelected
                    ? 'border border-border-subtle/80 bg-surface-raised text-fg shadow-xs'
                    : 'text-fg-muted hover:bg-surface-raised/40 hover:text-fg'
                }`}
              >
                {LEVEL_LABELS[level]}
              </button>
            )
          })}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-soft p-3 text-body-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end pt-1">
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          isLoading={isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? 'Generando palabras con IA…' : 'Crear con Gemini'}
        </Button>
      </div>
    </div>
  )
}
