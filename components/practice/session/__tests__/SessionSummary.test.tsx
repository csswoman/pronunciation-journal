// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { formatExerciseLabel, SessionSummary } from '../SessionSummary'
import type { SessionResult } from '@/lib/practice/types'

const result: SessionResult = {
  accuracy: 100,
  totalTimeMs: 1000,
  bySlug: {} as SessionResult['bySlug'],
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

describe('formatExerciseLabel', () => {
  it('uses targetWord when present', () => {
    expect(formatExerciseLabel('dictation', { targetWord: 'house' })).toBe('house')
  })

  it('falls back to a readable slug label', () => {
    expect(formatExerciseLabel('sentence_dictation', null)).toBe('Sentence Dictation')
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
