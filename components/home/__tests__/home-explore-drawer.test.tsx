// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomeExploreDrawer from '@/components/home/HomeExploreDrawer'

describe('HomeExploreDrawer', () => {
  it('renders its summary label', () => {
    render(<HomeExploreDrawer><p>contenido</p></HomeExploreDrawer>)
    expect(screen.getByText(/explorar/i)).toBeInTheDocument()
  })

  it('is collapsed by default', () => {
    const { container } = render(
      <HomeExploreDrawer><p>contenido</p></HomeExploreDrawer>,
    )
    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details!.open).toBe(false)
  })

  it('keeps its children in the DOM for accessibility and prefetch', () => {
    render(<HomeExploreDrawer><p>contenido oculto</p></HomeExploreDrawer>)
    expect(screen.getByText('contenido oculto')).toBeInTheDocument()
  })
})
