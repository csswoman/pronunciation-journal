// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhonemeFeedbackTable } from '../PhonemeFeedbackTable'
import type { WordResult } from '@/lib/types'

const playIpaSound = vi.fn()
vi.mock('@/lib/pronunciation/ipa-audio', () => ({
  playIpaSound: (ipa: string) => playIpaSound(ipa),
}))

/** Palabra NO reconocida: "staff" se oyó como "stiff". */
const wordResults: WordResult[] = [
  {
    expected: 'staff',
    got: 'stiff',
    status: 'incorrect',
    phonemes: {
      expected: [], got: [], tip: null,
      alignment: [
        { phoneme: 's', ipa: 's', status: 'correct' },
        { phoneme: 't', ipa: 't', status: 'correct' },
        { phoneme: 'æ', ipa: 'æ', status: 'incorrect', got: 'ɪ', gotIpa: 'ɪ' },
        { phoneme: 'f', ipa: 'f', status: 'correct' },
      ],
    },
  },
]

/** Palabra reconocida por el STT. */
const recognized: WordResult[] = [
  {
    expected: 'staff',
    got: 'staff',
    status: 'correct',
    phonemes: {
      expected: [], got: [], tip: null,
      alignment: [
        { phoneme: 's', ipa: 's', status: 'correct' },
        { phoneme: 't', ipa: 't', status: 'correct' },
        { phoneme: 'æ', ipa: 'æ', status: 'correct' },
        { phoneme: 'f', ipa: 'f', status: 'correct' },
      ],
    },
  },
]

describe('PhonemeFeedbackTable', () => {
  it('muestra la articulación en los fonemas que difieren', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    expect(screen.getByText(/baja la lengua al frente/i)).toBeInTheDocument()
  })

  it('etiqueta los fonemas que difieren como "Posible dificultad", nunca como incorrectos', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    expect(screen.getByText(/posible dificultad/i)).toBeInTheDocument()
    expect(screen.queryByText(/^incorrecto$/i)).not.toBeInTheDocument()
  })

  it('no muestra filas de fonemas correctos cuando la palabra no se reconoció', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    expect(screen.queryByText('¡Excelente!')).not.toBeInTheDocument()
    // Solo /æ/ difiere → un único control de escucha.
    expect(screen.getAllByRole('button', { name: /escuchar el sonido/i })).toHaveLength(1)
  })

  it('con la palabra reconocida muestra una sola fila y ningún "¡Excelente!"', () => {
    render(<PhonemeFeedbackTable wordResults={recognized} />)
    expect(screen.getByText('Palabra reconocida')).toBeInTheDocument()
    expect(screen.queryByText('¡Excelente!')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /escuchar el sonido/i })).toHaveLength(0)
  })

  it('con la palabra no oída lo dice en vez de señalar cada sonido', () => {
    const missing: WordResult[] = [
      {
        expected: 'staff',
        got: '',
        status: 'missing',
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [
            { phoneme: 'æ', ipa: 'æ', status: 'missing' },
            { phoneme: 'f', ipa: 'f', status: 'missing' },
          ],
        },
      },
    ]
    render(<PhonemeFeedbackTable wordResults={missing} />)
    expect(screen.getByText('No se te oyó esta palabra')).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /escuchar el sonido/i })).toHaveLength(0)
  })

  it('aclara que la pista viene del texto reconocido, no del sonido', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    expect(screen.getByText(/no en un análisis del\s+sonido/i)).toBeInTheDocument()
  })

  it('no renderiza nada con wordResults vacío', () => {
    const { container } = render(<PhonemeFeedbackTable wordResults={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('omite palabras sin datos de fonemas sin romper', () => {
    const noPhonemes: WordResult[] = [{ expected: 'a', got: 'a', status: 'correct' }]
    const { container } = render(<PhonemeFeedbackTable wordResults={noPhonemes} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('reproduce el sonido IPA esperado al activar el control accesible', () => {
    playIpaSound.mockClear()
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar el sonido \/æ\//i }))
    expect(playIpaSound).toHaveBeenCalledWith('æ')
  })
})
