// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewLessonSection } from '../ReviewLessonSection'
import type { LessonReviewItem } from '@/lib/review/types'

describe('ReviewLessonSection', () => {
  it('renders empty message when no lessons are due', () => {
    render(<ReviewLessonSection lessons={[]} count={0} />)
    expect(screen.getByText(/No tienes lecciones pendientes de repaso/i)).toBeInTheDocument()
  })

  it('renders lesson cards with links and days elapsed', () => {
    const lessons: LessonReviewItem[] = [
      {
        id: 'immersion:1',
        title: 'Mastering Linked Sounds',
        type: 'immersion',
        typeLabel: 'Inmersión · B1 (Teacher Emma)',
        url: '/practice/immersion/mastering-linked-sounds',
        lastStudiedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        daysSinceStudy: 3,
      },
    ]

    render(<ReviewLessonSection lessons={lessons} count={1} />)
    expect(screen.getByText('Mastering Linked Sounds')).toBeInTheDocument()
    expect(screen.getByText(/Inmersión · B1/i)).toBeInTheDocument()
    expect(screen.getByText(/hace 3d/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Repasar →/i })).toHaveAttribute(
      'href',
      '/practice/immersion/mastering-linked-sounds',
    )
  })
})
