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
  it('hides the target word for the rodeo (circumlocution) constraint', () => {
    render(
      <ProductionTaskHeader
        exercise={exercise({
          constraint: {
            id: 'rodeo_circumlocution',
            label: 'Rodeo',
            promptEs: () => '',
            checkEn: '',
          },
        })}
        title="Di tu oración"
      />,
    )

    expect(screen.queryByText('umbrella')).not.toBeInTheDocument()
    expect(screen.getByText('Palabra secreta — no la digas')).toBeInTheDocument()
    // No "listen to the target word" affordance either — that would give it away too.
    expect(screen.queryByRole('button', { name: /Escuchar umbrella/i })).not.toBeInTheDocument()
  })

  it('shows the target word normally for other constraints', () => {
    render(
      <ProductionTaskHeader
        exercise={exercise({
          constraint: {
            id: 'spoken_verb_transform',
            label: 'Transformación',
            promptEs: () => '',
            checkEn: '',
          },
        })}
        title="Di tu oración"
      />,
    )

    expect(screen.getByText('umbrella')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Escuchar umbrella/i })).toBeInTheDocument()
  })
})
