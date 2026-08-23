// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRetrigger } from '../useRetrigger'

function TestButton() {
  const { ref, trigger } = useRetrigger<HTMLButtonElement>('animate-heart-pop')
  return (
    <button ref={ref} data-testid="btn" onClick={trigger}>
      heart
    </button>
  )
}

describe('useRetrigger', () => {
  it('adds the animation class on trigger', () => {
    render(<TestButton />)
    const btn = screen.getByTestId('btn')
    expect(btn.classList.contains('animate-heart-pop')).toBe(false)

    fireEvent.click(btn)

    expect(btn.classList.contains('animate-heart-pop')).toBe(true)
  })

  it('forces a reflow so back-to-back triggers both apply the class', () => {
    render(<TestButton />)
    const btn = screen.getByTestId('btn')

    // Force the reflow read to happen so we can assert it occurred.
    const reflowSpy = vi.spyOn(btn, 'offsetWidth', 'get')

    fireEvent.click(btn)
    fireEvent.click(btn)

    expect(btn.classList.contains('animate-heart-pop')).toBe(true)
    expect(reflowSpy).toHaveBeenCalled()
  })

  it('does not throw when ref is not yet attached', () => {
    function Unmounted() {
      const { trigger } = useRetrigger<HTMLButtonElement>('animate-heart-pop')
      return (
        <button data-testid="btn2" onClick={trigger}>
          no ref
        </button>
      )
    }
    render(<Unmounted />)
    const btn = screen.getByTestId('btn2')
    expect(() => fireEvent.click(btn)).not.toThrow()
  })
})
