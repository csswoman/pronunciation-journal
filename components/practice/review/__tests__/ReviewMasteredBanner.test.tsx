// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewMasteredBanner } from '../ReviewMasteredBanner'

describe('ReviewMasteredBanner', () => {
  it('renders the real counts passed in, not the 64/19/42/35 mock defaults', () => {
    render(
      <ReviewMasteredBanner masteredCount={3} newCount={1} learningCount={2} reviewCount={0} />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Nuevas 1')).toBeInTheDocument()
    expect(screen.getByText('Aprendiendo 2')).toBeInTheDocument()
    expect(screen.getByText('En repaso 0')).toBeInTheDocument()
    expect(screen.queryByText('64')).not.toBeInTheDocument()
  })

  it('renders zero mastered words honestly instead of a non-zero fallback', () => {
    render(
      <ReviewMasteredBanner masteredCount={0} newCount={0} learningCount={0} reviewCount={0} />,
    )

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Ver las 0')).toBeInTheDocument()
  })
})
