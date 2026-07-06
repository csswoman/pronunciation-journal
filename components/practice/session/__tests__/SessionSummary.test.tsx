// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  it('shows when progress is saving', () => {
    render(<SessionSummary result={result} progressSaveStatus="saving" onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.getByText(/saving progress/i)).toBeInTheDocument()
  })

  it('shows an alert when progress could not be saved', () => {
    render(<SessionSummary result={result} progressSaveStatus="error" onPracticeAgain={() => {}} onFinish={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/retry when the connection recovers/i)
  })
})
