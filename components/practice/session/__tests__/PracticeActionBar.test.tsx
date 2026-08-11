// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  PracticeActionBar,
  PracticeContinueButton,
  PracticeExerciseCard,
} from '../PracticeActionBar'

describe('PracticeActionBar', () => {
  it('renders the mobile dock and its content spacer', () => {
    const { container } = render(
      <PracticeActionBar>
        <PracticeContinueButton onClick={() => undefined} />
      </PracticeActionBar>,
    )

    expect(container.querySelector('.practice-action-bar__dock')).toBeInTheDocument()
    expect(container.querySelector('.practice-action-bar__spacer')).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses the canonical button and forwards interaction state', () => {
    const onClick = vi.fn()
    const { rerender } = render(<PracticeContinueButton onClick={onClick} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<PracticeContinueButton onClick={onClick} disabled />)
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })
})

describe('PracticeExerciseCard', () => {
  it('provides the shared semantic exercise surface', () => {
    const { container } = render(
      <PracticeExerciseCard>
        <p>Ejercicio</p>
      </PracticeExerciseCard>,
    )

    expect(container.firstChild).toHaveClass(
      'rounded-lg',
      'border-border-subtle',
      'bg-surface-raised',
      'layout-card-pad',
    )
  })
})
