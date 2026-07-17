// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepThreadHints } from '../StepThreadHints'

describe('StepThreadHints', () => {
  it('renders nothing when hints are empty', () => {
    const { container } = render(<StepThreadHints hints={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows word and source step kind', () => {
    render(
      <StepThreadHints
        hints={[
          { word: 'cat', fromStepTitle: 'Intro', fromStepKind: 'word_intro' },
        ]}
      />,
    )
    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText(/de Intro/i)).toBeInTheDocument()
  })
})
