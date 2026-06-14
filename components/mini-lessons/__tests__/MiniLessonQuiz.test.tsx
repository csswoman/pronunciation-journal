// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MiniLessonQuiz from '../MiniLessonQuiz'

const questions = [
  {
    question: 'Which vowel sound is in "ship"?',
    options: ['/iː/', '/ɪ/', '/e/', '/æ/'],
    correct: 1,
    explanation: 'The short /ɪ/ sound appears in "ship", "hit", "bin".',
  },
  {
    question: 'Which word rhymes with "beat"?',
    options: ['bit', 'bat', 'feet', 'but'],
    correct: 2,
    explanation: '"Feet" shares the /iː/ sound with "beat".',
  },
]

describe('MiniLessonQuiz', () => {
  it('renders all questions and their options as buttons', () => {
    render(<MiniLessonQuiz questions={questions} />)
    expect(screen.getByText('1. Which vowel sound is in "ship"?')).toBeInTheDocument()
    expect(screen.getByText('2. Which word rhymes with "beat"?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /A.*\/iː\// })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /B.*\/ɪ\// })).toBeInTheDocument()
  })

  it('does not show explanation before selection', () => {
    render(<MiniLessonQuiz questions={questions} />)
    expect(screen.queryByText('The short /ɪ/ sound appears')).not.toBeInTheDocument()
  })

  it('marks correct option green and shows explanation on correct selection', () => {
    render(<MiniLessonQuiz questions={questions} />)
    const correctBtn = screen.getByRole('button', { name: /B.*\/ɪ\// })
    fireEvent.click(correctBtn)
    expect(correctBtn.className).toContain('--correct')
    expect(screen.getByText('The short /ɪ/ sound appears in "ship", "hit", "bin".')).toBeInTheDocument()
  })

  it('marks selected wrong and correct green on wrong selection', () => {
    render(<MiniLessonQuiz questions={questions} />)
    const wrongBtn = screen.getByRole('button', { name: /A.*\/iː\// })
    fireEvent.click(wrongBtn)
    expect(wrongBtn.className).toContain('--wrong')
    const correctBtn = screen.getByRole('button', { name: /B.*\/ɪ\// })
    expect(correctBtn.className).toContain('--correct')
  })

  it('locks question after selection — clicking another option does nothing', () => {
    render(<MiniLessonQuiz questions={questions} />)
    const firstBtn = screen.getByRole('button', { name: /A.*\/iː\// })
    fireEvent.click(firstBtn)
    const secondBtn = screen.getByRole('button', { name: /C.*\/e\// })
    fireEvent.click(secondBtn)
    expect(firstBtn.className).toContain('--wrong')
    expect(secondBtn.className).not.toContain('--correct')
    expect(secondBtn.className).not.toContain('--wrong')
  })

  it('does not show score until all questions answered', () => {
    render(<MiniLessonQuiz questions={questions} />)
    fireEvent.click(screen.getByRole('button', { name: /B.*\/ɪ\// }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows score summary after all questions answered', () => {
    render(<MiniLessonQuiz questions={questions} />)
    fireEvent.click(screen.getByRole('button', { name: /B.*\/ɪ\// }))
    fireEvent.click(screen.getByRole('button', { name: /C.*feet/ }))
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status.textContent).toMatch(/2\s*\/\s*2/)
  })

  it('sets aria-disabled on all options after answering', () => {
    render(<MiniLessonQuiz questions={questions} />)
    fireEvent.click(screen.getByRole('button', { name: /B.*\/ɪ\// }))
    const allOptions = screen.getAllByRole('button', { name: /^[ABCD]/ }).slice(0, 4)
    allOptions.forEach(btn => {
      expect(btn).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
