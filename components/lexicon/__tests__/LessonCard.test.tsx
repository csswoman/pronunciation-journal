// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LessonCard } from '../LessonCard'

const baseProps = {
  id: 'backend-infra',
  icon: '⬡',
  title: 'Backend & Infra',
  wordsCompleted: 3,
  totalWords: 72,
  progress: 4,
  tags: [],
}

describe('LessonCard study mode badge', () => {
  it('shows "Reconocer" for a receptive category', () => {
    render(<LessonCard {...baseProps} studyMode="receptive" />)
    expect(screen.getByText('Reconocer')).toBeInTheDocument()
  })

  it('shows "Producir" for a productive category', () => {
    render(<LessonCard {...baseProps} studyMode="productive" />)
    expect(screen.getByText('Producir')).toBeInTheDocument()
  })

  it('renders no badge when studyMode is not provided', () => {
    render(<LessonCard {...baseProps} />)
    expect(screen.queryByText('Reconocer')).not.toBeInTheDocument()
    expect(screen.queryByText('Producir')).not.toBeInTheDocument()
  })

  it('surfaces the study mode in the compact row meta line too', () => {
    render(<LessonCard {...baseProps} studyMode="receptive" compact />)
    expect(screen.getByText(/Reconocer/)).toBeInTheDocument()
  })
})
