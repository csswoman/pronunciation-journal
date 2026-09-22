// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FocusErrorTrapPractice } from '../FocusErrorTrapPractice'

describe('FocusErrorTrapPractice', () => {
  it('oculta la solución hasta comprobar y puntúa la detección', () => {
    const onResult = vi.fn()
    const onComplete = vi.fn()
    render(<FocusErrorTrapPractice contentId="content-1" onResult={onResult} onComplete={onComplete} onRestart={vi.fn()} body={{ sentences: [
      { text: 'She go to school.', hasError: true, correction: 'She goes to school.', explanation: 'Con she se usa goes.' },
      { text: 'He walks home.', hasError: false },
    ] }} />)

    expect(screen.queryByText(/She goes to school/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Sí, tiene error'))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(screen.getByText(/She goes to school/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente oración' }))
    fireEvent.click(screen.getByLabelText('No, es correcta'))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente oración' }))
    expect(screen.getByText('Puntuación: 100 %')).toBeInTheDocument()
    expect(onResult).toHaveBeenCalledTimes(2)
    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ exerciseId: 'trap-1', isCorrect: true, userAnswer: 'no_error' }))
    expect(onComplete).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ exerciseId: 'trap-0' }), expect.objectContaining({ exerciseId: 'trap-1' })]))
  })
})
