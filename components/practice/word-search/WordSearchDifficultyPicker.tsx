'use client'

// Planned structure:
// <WordSearchDifficultyPicker>
//   <PickerLegend />
//   <DifficultyOption /> × 3   (fácil · normal · difícil, con palabras y direcciones)
// </WordSearchDifficultyPicker>

import type { WordSearchDifficulty } from '@/lib/exercises/word-search/types'
import { WORD_COUNT_BY_DIFFICULTY } from '@/lib/exercises/word-search/grid-generator'
import { setupOptionClass, setupOptionSubtitleClass } from './option-styles'

interface Props {
  difficulty: WordSearchDifficulty
  onChange: (difficulty: WordSearchDifficulty) => void
}

const OPTIONS: Array<{ id: WordSearchDifficulty; label: string; directions: string }> = [
  { id: 'easy', label: 'Fácil', directions: '→ ↓' },
  { id: 'normal', label: 'Normal', directions: '→ ↓ ↘ ↗' },
  { id: 'hard', label: 'Difícil', directions: 'también al revés' },
]

export default function WordSearchDifficultyPicker({ difficulty, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
        2 · DIFICULTAD
      </legend>

      <div
        role="radiogroup"
        aria-label="Dificultad del tablero"
        className="grid grid-cols-3 gap-2.5"
      >
        {OPTIONS.map((option) => {
          const isSelected = difficulty === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.id)}
              className={setupOptionClass(isSelected, 'flex flex-col gap-1 p-3')}
            >
              <span className="font-heading text-body-md font-bold">{option.label}</span>
              <span className={setupOptionSubtitleClass(isSelected)}>
                {WORD_COUNT_BY_DIFFICULTY[option.id]} palabras · {option.directions}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
