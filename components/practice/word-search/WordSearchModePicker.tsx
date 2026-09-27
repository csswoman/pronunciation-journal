'use client'

// Planned structure:
// <WordSearchModePicker>
//   <PickerHeader title="1 · CÓMO BUSCAR" />
//   <OptionsGrid>
//     <ModeCard option="classic" title="Con la lista a la vista" />
//     <ModeCard option="clues" title="Solo con pistas" badge="DIFÍCIL" />
//     <ModeCard option="listen" title="De oído" badge="NUEVO" />
//   </OptionsGrid>
// </WordSearchModePicker>

import type { WordSearchMode } from '@/lib/exercises/word-search/types'
import { Check } from '@/components/icons'
import { setupOptionClass, setupOptionSubtitleClass } from './option-styles'

interface Props {
  mode: WordSearchMode
  onChange: (mode: WordSearchMode) => void
}

const MODES: Array<{ id: WordSearchMode; title: string; subtitle: string; badge?: string }> = [
  {
    id: 'classic',
    title: 'Con la lista a la vista',
    subtitle: 'Ves las palabras y su IPA al lado del tablero.',
  },
  {
    id: 'clues',
    title: 'Solo con pistas',
    subtitle: 'Deduces cada palabra desde su definición.',
    badge: 'DIFÍCIL',
  },
  {
    id: 'listen',
    title: 'De oído',
    subtitle: 'Escuchas la palabra y la buscas sin verla escrita.',
    badge: 'ESCUCHA',
  },
]

export default function WordSearchModePicker({ mode, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
        1 · CÓMO BUSCAR
      </legend>

      <div
        role="radiogroup"
        aria-label="Modo de juego para la sopa de letras"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {MODES.map((option) => {
          const isSelected = mode === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.id)}
              className={setupOptionClass(isSelected, 'group flex flex-col justify-between gap-2 p-4')}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2 font-heading text-body-md font-bold leading-snug">
                  {option.title}
                  {option.badge ? (
                    <span className="inline-flex items-center rounded-full bg-warning-soft px-2.5 py-0.5 font-mono text-tiny font-bold uppercase text-warning">
                      {option.badge}
                    </span>
                  ) : null}
                </span>
                {isSelected && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Check size={13} strokeWidth={3} aria-hidden />
                  </span>
                )}
              </div>
              <span className={setupOptionSubtitleClass(isSelected)}>{option.subtitle}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
