// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { formatExerciseLabel, SessionSummary } from '../SessionSummary'
import type { SessionResult } from '@/lib/practice/types'

const result: SessionResult = {
  accuracy: 100,
  totalTimeMs: 1000,
  bySlug: {
    fill_blank: { correct: 1, total: 1 },
  } as SessionResult['bySlug'],
  results: [{
    exerciseId: 'e1',
    slug: 'fill_blank',
    exerciseTypeId: 5,
    isCorrect: true,
    timeMs: 1000,
    contentId: 'word-1',
    context: 'practice',
    completedAt: new Date('2026-01-01T00:00:00Z'),
  }],
}

const mixedResult: SessionResult = {
  accuracy: 50,
  totalTimeMs: 87_000,
  bySlug: {
    pick_word: { correct: 2, total: 2 },
    odd_one_out: { correct: 0, total: 2 },
    dictation: { correct: 0, total: 1 },
    ax_same_different: { correct: 0, total: 1 },
  } as SessionResult['bySlug'],
  results: [
    {
      exerciseId: 'e1',
      slug: 'pick_word',
      exerciseTypeId: 1,
      isCorrect: true,
      timeMs: 1000,
      contentId: 'c1',
      context: 'practice',
      completedAt: new Date('2026-01-01T00:00:00Z'),
      exercisePayload: { targetWord: 'miss' },
    },
    {
      exerciseId: 'e2',
      slug: 'pick_word',
      exerciseTypeId: 1,
      isCorrect: true,
      timeMs: 1000,
      contentId: 'c2',
      context: 'practice',
      completedAt: new Date('2026-01-01T00:00:00Z'),
      exercisePayload: { targetWord: 'quick' },
    },
    {
      exerciseId: 'e3',
      slug: 'odd_one_out',
      exerciseTypeId: 13,
      isCorrect: false,
      timeMs: 1000,
      contentId: 'c3',
      context: 'practice',
      completedAt: new Date('2026-01-01T00:00:00Z'),
      exercisePayload: { targetWord: 'bit' },
    },
    {
      exerciseId: 'e4',
      slug: 'odd_one_out',
      exerciseTypeId: 13,
      isCorrect: false,
      timeMs: 1000,
      contentId: 'c4',
      context: 'practice',
      completedAt: new Date('2026-01-01T00:00:00Z'),
      exercisePayload: { targetWord: 'sit' },
    },
    {
      exerciseId: 'e5',
      slug: 'dictation',
      exerciseTypeId: 4,
      isCorrect: false,
      timeMs: 1000,
      contentId: 'c5',
      context: 'practice',
      completedAt: new Date('2026-01-01T00:00:00Z'),
      exercisePayload: { targetWord: 'drink' },
    },
    {
      exerciseId: 'e6',
      slug: 'ax_same_different',
      exerciseTypeId: 12,
      isCorrect: false,
      timeMs: 1000,
      contentId: 'c6',
      context: 'practice',
      completedAt: new Date('2026-01-01T00:00:00Z'),
    },
  ],
}

describe('formatExerciseLabel', () => {
  it('uses targetWord when present', () => {
    expect(formatExerciseLabel('dictation', { targetWord: 'house' })).toBe('house')
  })

  it('falls back to a facet label', () => {
    expect(formatExerciseLabel('sentence_dictation', null)).toBe('Escribir')
  })
})

describe('SessionSummary summary content', () => {
  it('shows compact skill facets instead of exercise types', () => {
    render(
      <SessionSummary
        result={mixedResult}
        practiceIpa="/ɪ/"
        onPracticeAgain={() => {}}
        onFinish={() => {}}
      />,
    )

    expect(screen.getByText('Hoy conviene reforzar bit, sit y drink.')).toBeInTheDocument()
    expect(screen.getByText('Escuchar')).toBeInTheDocument()
    expect(screen.getByText('Elegir')).toBeInTheDocument()
    expect(screen.getByText('Escribir')).toBeInTheDocument()
    expect(screen.getAllByText('A reforzar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Bien')).toBeInTheDocument()
    expect(screen.queryByText('Oído')).not.toBeInTheDocument()
    expect(screen.queryByText('El diferente')).not.toBeInTheDocument()
    expect(screen.queryByText('Rendimiento')).not.toBeInTheDocument()
    expect(screen.queryByText('✗')).not.toBeInTheDocument()
  })

  it('shows a positive insight when nothing needs reinforce', () => {
    render(<SessionSummary result={result} onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.getByText('Buen ritmo en esta tanda.')).toBeInTheDocument()
  })
})

describe('SessionSummary progress state', () => {
  it('shows the practiced phoneme when provided', () => {
    render(
      <SessionSummary
        result={result}
        practiceIpa="/ŋ/"
        onPracticeAgain={() => {}}
        onFinish={() => {}}
      />,
    )
    expect(screen.getByText('/ŋ/')).toBeInTheDocument()
  })

  it('shows when progress is saving', () => {
    render(<SessionSummary result={result} progressSaveStatus="saving" onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.getByText(/guardando progreso/i)).toBeInTheDocument()
  })

  it('shows an alert when progress could not be saved', () => {
    render(<SessionSummary result={result} progressSaveStatus="error" onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/reintentará al recuperar la conexión/i)
  })

  it('confirms sync only once every operation in the flush pass succeeded', () => {
    render(<SessionSummary result={result} progressSaveStatus="synced" onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.getByText(/progreso sincronizado/i)).toBeInTheDocument()
  })

  it('reports local-only save when the flush left pending or failed operations', () => {
    render(<SessionSummary result={result} progressSaveStatus="saved_local" onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.getByText(/guardado en este dispositivo/i)).toBeInTheDocument()
    expect(screen.getByText(/se sincronizará al recuperar la conexión/i)).toBeInTheDocument()
  })

  it('offers a manual retry for saved_local and error states', () => {
    const onRetrySync = vi.fn()
    render(<SessionSummary result={result} progressSaveStatus="saved_local" onRetrySync={onRetrySync} onPracticeAgain={() => {}} onFinish={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(onRetrySync).toHaveBeenCalledTimes(1)
  })

  it('does not offer retry once fully synced', () => {
    render(<SessionSummary result={result} progressSaveStatus="synced" onRetrySync={() => {}} onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.queryByRole('button', { name: /reintentar ahora/i })).not.toBeInTheDocument()
  })
})
