// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChatTabs, { TABS } from '../ChatTabs'

describe('ChatTabs', () => {
  it('has a missions tab, not an ambiguous Interview tab', () => {
    expect(TABS.some((tab) => tab.id === 'interview')).toBe(false)
    expect(TABS.some((tab) => tab.id === 'missions')).toBe(true)
  })

  it('renders the missions tab label and description', () => {
    render(<ChatTabs active="missions" onChange={vi.fn()} />)

    expect(screen.getByText('Misiones')).toBeInTheDocument()
    expect(screen.getByText('Completa un objetivo real')).toBeInTheDocument()
  })
})
