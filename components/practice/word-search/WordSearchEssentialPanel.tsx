'use client'

// Planned structure:
// <WordSearchEssentialPanel>
//   <InsetContainer>
//     <PanelHeader title="Palabras esenciales" />
//     <CefrLevelRadioGroup />
//   </InsetContainer>
//   <ErrorAlert />
//   <ActionRow buttonCTA textNote />
// </WordSearchEssentialPanel>

import type { CefrLevel } from '@/lib/essential-words/types'
import { ESSENTIAL_LEVEL_LABELS } from '@/lib/exercises/word-search/essential-loader'
import Button from '@/components/ui/Button'
import { ArrowRight } from '@/components/icons'
import { setupOptionClass } from './option-styles'

interface Props {
  level: CefrLevel
  onLevelChange: (level: CefrLevel) => void
  isLoading: boolean
  error: string | null
  onStart: () => void
}

const LEVELS = Object.keys(ESSENTIAL_LEVEL_LABELS) as CefrLevel[]

export default function WordSearchEssentialPanel({
  level,
  onLevelChange,
  isLoading,
  error,
  onStart,
}: Props) {
  return (
    <div
      id="word-search-panel-essential"
      role="tabpanel"
      aria-labelledby="word-search-tab-essential"
      tabIndex={0}
      className="flex flex-col gap-5 focus:outline-none"
    >
      <div className="flex flex-col gap-3.5 rounded-2xl border border-border-subtle bg-surface-sunken p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-body-md font-bold text-fg">Palabras esenciales</h3>
          <p className="text-body-sm text-fg-muted">
            Las ~2 600 palabras más frecuentes del inglés, por nivel. Cada tablero evita las
            que ya jugaste.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Nivel CEFR de las palabras"
          className="grid grid-cols-2 gap-2 sm:grid-cols-5"
        >
          {LEVELS.map((option) => {
            const isSelected = level === option
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onLevelChange(option)}
                className={setupOptionClass(isSelected, 'flex min-h-11 items-center justify-center px-3 py-2 text-center text-caption font-bold')}
              >
                {ESSENTIAL_LEVEL_LABELS[option]}
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

      <div className="flex flex-col items-start gap-3.5 pt-1 sm:flex-row sm:items-center">
        <Button
          variant="primary"
          className="h-14 shrink-0 gap-2 rounded-full px-7 text-base font-bold"
          isLoading={isLoading}
          onClick={onStart}
        >
          <span>{isLoading ? 'Creando tablero…' : 'Comenzar partida'}</span>
          {!isLoading && <ArrowRight size={18} aria-hidden />}
        </Button>

        <span className="font-sans text-caption text-fg-muted">
          Al terminar podrás guardar las palabras en tu cuaderno.
        </span>
      </div>
    </div>
  )
}
