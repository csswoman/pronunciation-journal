// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ContentLevelSelector from '../ContentLevelSelector'

describe('ContentLevelSelector', () => {
  it('exposes the selected level and reports a new selection', () => {
    const onChange = vi.fn()

    render(
      <ContentLevelSelector
        levels={['A1', 'A2', 'B1'] as const}
        value="A1"
        onChange={onChange}
        ariaLabel="Nivel de estudio"
      />,
    )

    expect(screen.getByRole('button', { name: 'A1' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'A2' }))
    expect(onChange).toHaveBeenCalledWith('A2')
  })

  it('supports level-specific labels and a disabled state', () => {
    render(
      <ContentLevelSelector
        levels={['a1', 'a2'] as const}
        value="a1"
        onChange={vi.fn()}
        ariaLabel="Nivel de foco"
        getLabel={(level) => level.toUpperCase()}
        disabled
      />,
    )

    expect(screen.getByRole('button', { name: 'A1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'A2' })).toBeDisabled()
  })
})
