// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

import { ProductionTaskHeader } from '../ProductionTaskHeader'
import type { SpokenProductionExercise } from '@/lib/exercises/types'

function exercise(overrides: Partial<SpokenProductionExercise> = {}): SpokenProductionExercise {
  return {
    id: 'spoken-production-1',
    type: 'spoken_production',
    taskPrompt: 'Describe qué es o para qué sirve "umbrella" SIN decir la palabra "umbrella".',
    targetItem: 'umbrella',
    sourceRef: { source: 'word_bank', id: 'word-1' },
    exerciseType: { domain: 'vocabulary', mode: 'speak', variant: 'sentence' },
    ...overrides,
  }
}

describe('ProductionTaskHeader', () => {
  it('shows the secret word without audio for the rodeo (circumlocution) constraint', () => {
    render(
      <ProductionTaskHeader
        exercise={exercise({
          constraint: {
            id: 'rodeo_circumlocution',
    minLevel: 'B1',
            label: 'Rodeo',
            promptEs: () => '',
            checkEn: '',
          },
        })}
        title="Di tu oración"
      />,
    )

    // The learner sees the word so they can describe it, but the prompt paragraph is hidden.
    expect(screen.getAllByText('umbrella')).toHaveLength(1)
    expect(screen.getByText('Palabra secreta · no la digas')).toBeInTheDocument()
    // No "listen to the target word" affordance — hearing it doesn't help the circumlocution.
    expect(screen.queryByRole('button', { name: /Escuchar umbrella/i })).not.toBeInTheDocument()
  })

  it('shows the target word normally for other constraints', () => {
    render(
      <ProductionTaskHeader
        exercise={exercise({
          constraint: {
            id: 'spoken_verb_transform',
    minLevel: 'A2',
            label: 'Transformación',
            promptEs: () => '',
            checkEn: '',
          },
        })}
        title="Di tu oración"
      />,
    )

    // The word shows in the target card and bolded inside the prompt.
    expect(screen.getAllByText('umbrella').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Escuchar umbrella/i })).toBeInTheDocument()
  })
})
