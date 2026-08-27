// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpokenLineFeedback } from '../SpokenLineFeedback'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import type { WordResult } from '@/lib/types'

const words: WordResult[] = [
  { expected: 'I', got: 'I', status: 'correct' },
  { expected: 'like', got: 'lake', status: 'incorrect' },
  { expected: 'coffee', got: '', status: 'missing' },
]

const syllableMap = new Map<string, SyllableResult[]>()

describe('SpokenLineFeedback', () => {
  it('marca cada palabra con su estado, no solo las falladas', () => {
    render(<SpokenLineFeedback wordResults={words} syllableMap={syllableMap} />)

    expect(screen.getByLabelText('I: bien')).toBeInTheDocument()
    expect(screen.getByLabelText('like: mal')).toBeInTheDocument()
    expect(screen.getByLabelText('coffee: no se te oyó')).toBeInTheDocument()
  })

  it('mantiene las palabras en linea, como una frase', () => {
    const { container } = render(
      <SpokenLineFeedback wordResults={words} syllableMap={syllableMap} />)

    // El bug: cada palabra caia en su propia fila y la frase se leia vertical.
    const row = container.querySelector('[data-testid="spoken-line"]')!
    expect(row.className).toContain('flex-wrap')
    expect(row.className).not.toContain('flex-col')
  })

  it('desglosa en silabas la palabra fallada cuando el mapeo es fiable', () => {
    const map = new Map<string, SyllableResult[]>([
      ['coffee', [
        { text: 'cof', phonemes: [], status: 'error', culprit: null },
        { text: 'fee', phonemes: [], status: 'correct', culprit: null },
      ]],
    ])
    render(<SpokenLineFeedback
      wordResults={[{ expected: 'coffee', got: 'copy', status: 'incorrect' }]}
      syllableMap={map}
    />)

    expect(screen.getByLabelText('cof: mal')).toBeInTheDocument()
    expect(screen.getByLabelText('fee: bien')).toBeInTheDocument()
  })

  it('cae a la palabra entera si el mapeo silabico no es fiable', () => {
    render(<SpokenLineFeedback
      wordResults={[{ expected: 'comfortable', got: 'confortable', status: 'incorrect' }]}
      syllableMap={new Map()}
    />)

    // Nunca inventa silabas: pinta la palabra entera en rojo.
    expect(screen.getByLabelText('comfortable: mal')).toBeInTheDocument()
  })
})

describe('SpokenLineFeedback — color', () => {
  it('pinta en verde lo que se dijo bien', () => {
    render(<SpokenLineFeedback wordResults={words} syllableMap={syllableMap} />)

    // Neutro no basta: sin verde, un acierto no se lee como acierto.
    expect(screen.getByLabelText('I: bien').className).toContain('success')
  })

  it('pinta en rojo lo que se dijo mal', () => {
    render(<SpokenLineFeedback wordResults={words} syllableMap={syllableMap} />)
    expect(screen.getByLabelText('like: mal').className).toContain('error')
  })
})
