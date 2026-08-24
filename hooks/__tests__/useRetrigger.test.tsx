// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRetrigger, useRetriggerOnIncrease } from '../useRetrigger'

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

function TestCounter({ value }: { value: number }) {
  const ref = useRetriggerOnIncrease<HTMLSpanElement>(value, 'animate-notification-bounce')
  return (
    <span ref={ref} data-testid="counter">
      {value}
    </span>
  )
}

describe('useRetriggerOnIncrease', () => {
  it('does not animate on first mount', () => {
    render(<TestCounter value={3} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(false)
  })

  it('animates when the value increases', () => {
    const { rerender } = render(<TestCounter value={3} />)
    rerender(<TestCounter value={4} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(true)
  })

  it('does not animate when the value decreases', () => {
    const { rerender } = render(<TestCounter value={5} />)
    rerender(<TestCounter value={2} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(false)
  })

  it('does not animate when the value is unchanged', () => {
    const { rerender } = render(<TestCounter value={5} />)
    rerender(<TestCounter value={5} />)
    const el = screen.getByTestId('counter')
    expect(el.classList.contains('animate-notification-bounce')).toBe(false)
  })
})
