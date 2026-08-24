// @vitest-environment jsdom
import React, { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useInitialStagger } from '../useInitialStagger'

function TestList({ currentDeck }: { currentDeck: string }) {
  const [filter, setFilter] = useState('')
  const { getStaggerStyle } = useInitialStagger(currentDeck)

  const items = [`${currentDeck}-1`, `${currentDeck}-2`].filter((i) => i.includes(filter))

  return (
    <div>
      <input
        data-testid="filter-input"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul>
        {items.map((item, idx) => (
          <li key={item} data-testid={`item-${item}`} style={getStaggerStyle(idx)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

describe('useInitialStagger', () => {
  it('assigns stagger style on initial render and removes it on filter change re-render', () => {
    const { rerender } = render(<TestList currentDeck="deck-a" />)

    // Initial render of deck-a
    const itemA1 = screen.getByTestId('item-deck-a-1')
    expect(itemA1.style.getPropertyValue('--stagger-index')).toBe('0')

    // Local keystroke / search filter re-render (same deck)
    const input = screen.getByTestId('filter-input')
    fireEvent.change(input, { target: { value: '1' } })

    const itemA1Filtered = screen.getByTestId('item-deck-a-1')
    expect(itemA1Filtered.style.getPropertyValue('--stagger-index')).toBe('')

    // Switching to deck-b without unmounting the component:
    rerender(<TestList currentDeck="deck-b" />)

    // First render of deck-b triggers stagger again
    const itemB1 = screen.getByTestId('item-deck-b-1')
    expect(itemB1.style.getPropertyValue('--stagger-index')).toBe('0')
  })
})
