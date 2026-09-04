// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SaveWordModal from '../SaveWordModal'

describe('SaveWordModal', () => {
  it('calls onClose when pressing Escape', () => {
    const handleClose = vi.fn()
    const handleConfirm = vi.fn()

    render(
      <SaveWordModal
        word="ubiquitous"
        context="It is ubiquitous in tech."
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('renders modal with word and allows submitting', () => {
    const handleClose = vi.fn()
    const handleConfirm = vi.fn()

    render(
      <SaveWordModal
        word="ubiquitous"
        context="It is ubiquitous in tech."
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    )

    expect(screen.getByText('Save Vocabulary')).toBeInTheDocument()
    expect(screen.getByText('ubiquitous')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(handleConfirm).toHaveBeenCalledWith({
      word: 'ubiquitous',
      meaning: '',
      difficulty: 'medium',
      context: 'It is ubiquitous in tech.',
    })
  })
})
