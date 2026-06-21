// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MiniLessonComplete from '../MiniLessonComplete'

const recordLessonCompleteMock = vi.fn().mockResolvedValue(undefined)
const isLessonCompleteMock = vi.fn().mockResolvedValue(false)

vi.mock('@/lib/practice/queries', () => ({
  recordLessonComplete: (...args: unknown[]) => recordLessonCompleteMock(...args),
}))

vi.mock('@/lib/db', () => ({
  isLessonComplete: (...args: unknown[]) => isLessonCompleteMock(...args),
}))

beforeEach(() => {
  recordLessonCompleteMock.mockClear()
  isLessonCompleteMock.mockReset().mockResolvedValue(false)
})

describe('MiniLessonComplete', () => {
  it('records completion when Mark as read is clicked', async () => {
    render(<MiniLessonComplete slug="silent-letters" />)

    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }))

    await waitFor(() => {
      expect(recordLessonCompleteMock).toHaveBeenCalledWith('mini-lessons', 'silent-letters')
    })
    expect(screen.getByRole('status')).toHaveTextContent('Lesson marked as read')
  })

  it('does not write again when already complete', async () => {
    isLessonCompleteMock.mockResolvedValue(true)
    render(<MiniLessonComplete slug="silent-letters" />)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Lesson marked as read')
    })

    expect(recordLessonCompleteMock).not.toHaveBeenCalled()
  })
})
