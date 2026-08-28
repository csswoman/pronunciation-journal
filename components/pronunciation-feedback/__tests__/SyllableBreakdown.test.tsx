// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyllableBreakdown } from '../SyllableBreakdown'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'

const results: SyllableResult[] = [
  { text: 'hap', phonemes: [], status: 'error', culprit: { phoneme: 'AE', status: 'incorrect' } },
  { text: 'py', phonemes: [], status: 'correct', culprit: null },
]

describe('SyllableBreakdown', () => {
  it('muestra cada sílaba', () => {
    render(<SyllableBreakdown syllables={results} />)
    expect(screen.getByText('hap')).toBeInTheDocument()
    expect(screen.getByText('py')).toBeInTheDocument()
  })

  it('etiqueta el estado de cada sílaba para lectores de pantalla', () => {
    render(<SyllableBreakdown syllables={results} />)
    expect(screen.getByLabelText(/hap.*mal/i)).toBeInTheDocument()
  })
})

describe('SyllableBreakdown — color', () => {
  it('pinta en verde la silaba correcta', () => {
    render(<SyllableBreakdown syllables={[
      { text: 'cof', phonemes: [], status: 'correct', culprit: null },
    ]} />)
    expect(screen.getByLabelText('cof: bien').className).toContain('success')
  })
})
