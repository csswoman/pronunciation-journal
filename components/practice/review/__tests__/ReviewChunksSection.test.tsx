// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReviewChunksSection } from '../ReviewChunksSection'

describe('ReviewChunksSection', () => {
  it('does not render when chunksCount is 0', () => {
    const { container } = render(
      <ReviewChunksSection chunksCount={0} onStartReview={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders section card with chunk count and triggers review on click', () => {
    const handleStart = vi.fn()
    render(<ReviewChunksSection chunksCount={3} onStartReview={handleStart} />)

    expect(screen.getByText('Expresiones y Chunks')).toBeInTheDocument()
    expect(screen.getByText(/3\s+elementos/i)).toBeInTheDocument()
    expect(screen.getByText(/Tienes 3 expresiones listas para afianzar/i)).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /repasar en sesión completa/i })
    fireEvent.click(btn)

    expect(handleStart).toHaveBeenCalledTimes(1)
  })
})
