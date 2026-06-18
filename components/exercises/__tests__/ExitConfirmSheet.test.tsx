// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExitConfirmSheet } from '../ExitConfirmSheet'

describe('ExitConfirmSheet', () => {
  it('renders when open', () => {
    render(<ExitConfirmSheet open onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Quit this session?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep practicing/i })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ExitConfirmSheet open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByText('Quit this session?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when End session is clicked', () => {
    const onConfirm = vi.fn()
    render(<ExitConfirmSheet open onConfirm={onConfirm} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Keep practicing is clicked', () => {
    const onCancel = vi.fn()
    render(<ExitConfirmSheet open onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /keep practicing/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = vi.fn()
    render(<ExitConfirmSheet open onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not call onCancel on Escape when closed', () => {
    const onCancel = vi.fn()
    render(<ExitConfirmSheet open={false} onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('has aria-modal and dialog role', () => {
    render(<ExitConfirmSheet open onConfirm={vi.fn()} onCancel={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'exit-dialog-title')
  })
})
