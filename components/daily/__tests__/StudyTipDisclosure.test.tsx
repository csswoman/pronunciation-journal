// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StudyTipDisclosure from '../StudyTipDisclosure'

describe('StudyTipDisclosure', () => {
  it('renders the summary and is closed by default', () => {
    const { container } = render(<StudyTipDisclosure />)
    expect(screen.getByText('¿Cómo estudiar hoy?')).toBeInTheDocument()
    expect(container.querySelector('details')?.open).toBe(false)
  })

  it('mentions natural acquisition and never "Salas"', () => {
    render(<StudyTipDisclosure />)
    expect(screen.getByText(/adquisición natural/i)).toBeInTheDocument()
    expect(screen.queryByText(/Salas/i)).not.toBeInTheDocument()
  })
})
