// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExerciseBlock from '../ExerciseBlock'

const props = {
  instruction: 'Read these sentences aloud:',
  items: ['The ship sank slowly.', 'She sells seashells.', 'How much wood would a woodchuck chuck?'],
}

describe('ExerciseBlock', () => {
  it('renders instruction and all items', () => {
    render(<ExerciseBlock {...props} />)
    expect(screen.getByText('Read these sentences aloud:')).toBeInTheDocument()
    expect(screen.getByText('The ship sank slowly.')).toBeInTheDocument()
    expect(screen.getByText('She sells seashells.')).toBeInTheDocument()
  })

  it('renders items as buttons with aria-pressed false initially', () => {
    render(<ExerciseBlock {...props} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks item as checked on click', () => {
    render(<ExerciseBlock {...props} />)
    const btn = screen.getAllByRole('button')[0]
    fireEvent.click(btn)
    expect(btn.className).toContain('--checked')
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('unchecks item on second click', () => {
    render(<ExerciseBlock {...props} />)
    const btn = screen.getAllByRole('button')[0]
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn.className).not.toContain('--checked')
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('checking one item does not affect others', () => {
    render(<ExerciseBlock {...props} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(buttons[1].className).not.toContain('--checked')
    expect(buttons[2].className).not.toContain('--checked')
  })
})
