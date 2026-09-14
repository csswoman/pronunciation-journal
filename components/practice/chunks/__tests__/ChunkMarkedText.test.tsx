// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChunkMarkedText } from '../ChunkMarkedText'

describe('ChunkMarkedText', () => {
  it('renders only the author-derived range as marked', () => {
    render(<ChunkMarkedText text="Where are you from?" highlights={[{ start: 0, end: 5 }]} />)
    expect(screen.getByText('Where').tagName).toBe('MARK')
    expect(screen.getByText('Where')).toHaveClass('underline')
    expect(screen.getByText('are you from?')).not.toBeNull()
  })

  it('keeps legacy chunks readable when no graph exists', () => {
    render(<ChunkMarkedText text="Nice to meet you." highlights={[]} />)
    expect(screen.getByText('Nice to meet you.')).toBeVisible()
  })
})
