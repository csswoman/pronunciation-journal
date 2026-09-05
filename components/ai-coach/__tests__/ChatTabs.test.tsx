// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChatTabs, { TABS } from '../ChatTabs'

describe('ChatTabs', () => {
  it('has a missions tab, not an ambiguous Interview tab', () => {
    const tabIds = TABS.map((tab) => tab.id as string)
    expect(tabIds).not.toContain('interview')
    expect(tabIds).toContain('missions')
  })

  it('renders the missions tab label and exposes description metadata', () => {
    render(<ChatTabs active="missions" onChange={vi.fn()} />)

    expect(screen.getByText('Misiones')).toBeInTheDocument()
    expect(TABS.find((tab) => tab.id === 'missions')?.desc).toBe('Lee un guion en voz alta')
  })
})
