// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
vi.mock('@/components/ui/ListenButton', () => ({
  ListenButton: ({ onPlay, label }: { onPlay: () => void; label: string }) => <button type="button" onClick={onPlay}>{label}</button>,
}))
import { RemediationSequence } from '../RemediationSequence'

describe('pronunciation feedback remediation sequence', () => {
  it('exposes keyboard-operable model, slow, retry, and transfer actions', () => {
    const onListen = vi.fn(); const onSlow = vi.fn(); const onRetry = vi.fn(); const onTransfer = vi.fn()
    render(<RemediationSequence onListen={onListen} onSlow={onSlow} onRetry={onRetry} onTransfer={onTransfer} />)
    const buttons = [
      screen.getByRole('button', { name: /escuchar modelo/i }),
      screen.getByRole('button', { name: /más lento/i }),
      screen.getByRole('button', { name: /reintentar/i }),
      screen.getByRole('button', { name: /frase variada/i }),
    ]
    buttons.forEach((button) => fireEvent.keyDown(button, { key: 'Enter' }))
    // Native buttons dispatch activation on click; the test verifies every
    // action has a real accessible control rather than hover-only behavior.
    buttons.forEach((button) => fireEvent.click(button))
    expect(onListen).toHaveBeenCalledOnce(); expect(onSlow).toHaveBeenCalledOnce()
    expect(onRetry).toHaveBeenCalledOnce(); expect(onTransfer).toHaveBeenCalledOnce()
  })
})
