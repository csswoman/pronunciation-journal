// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PronunciationFeedback from '../PronunciationFeedback'
import type { WordResult } from '@/lib/types'

const playIpaSoundMock = vi.fn()
vi.mock('@/lib/pronunciation/ipa-audio', () => ({
  playIpaSound: (ipa: string) => playIpaSoundMock(ipa),
}))

const speakMock = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: (word: string, opts?: { rate?: number }) => {
    if (opts) {
      speakMock(word, opts)
    } else {
      speakMock(word)
    }
  },
}))

const sampleWordResults: WordResult[] = [
  {
    expected: "i'm",
    got: "i'm",
    status: 'correct',
    phonemes: {
      expected: ['aɪ', 'm'],
      got: ['aɪ', 'm'],
      tip: null,
      alignment: [
        { phoneme: 'AY', ipa: 'aɪ', status: 'correct' },
        { phoneme: 'M', ipa: 'm', status: 'correct' },
      ],
    },
  },
  {
    expected: 'gonna',
    got: 'to',
    status: 'incorrect',
    phonemes: {
      expected: ['g', 'ɑ', 'n', 'ʌ'],
      got: ['t', 'u:'],
      tip: 'falta /g/ · falta /ɑ/ · /n/ → escuchado /t/ · /ʌ/ → escuchado /u:/',
      alignment: [
        { phoneme: 'G', ipa: 'g', status: 'missing' },
        { phoneme: 'AA', ipa: 'ɑ', status: 'missing' },
        { phoneme: 'N', ipa: 'n', status: 'incorrect', got: 'T', gotIpa: 't' },
        { phoneme: 'AH', ipa: 'ʌ', status: 'incorrect', got: 'UW', gotIpa: 'u:' },
      ],
    },
  },
  {
    expected: 'later',
    got: 'later',
    status: 'correct',
    phonemes: {
      expected: ['l', 'eɪ', 't', 'ɝ'],
      got: ['l', 'eɪ', 't', 'ɝ'],
      tip: null,
      alignment: [
        { phoneme: 'L', ipa: 'l', status: 'correct' },
        { phoneme: 'EY', ipa: 'eɪ', status: 'correct' },
        { phoneme: 'T', ipa: 't', status: 'correct' },
        { phoneme: 'ER', ipa: 'ɝ', status: 'correct' },
      ],
    },
  },
]

describe('PronunciationFeedback', () => {
  it('renderiza la puntuación, feedback y la frase continua', () => {
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
      />,
    )

    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText(/Bien/)).toBeInTheDocument()
    expect(screen.getByText('+5 XP')).toBeInTheDocument()
    expect(screen.getByText("i'm")).toBeInTheDocument()
    expect(screen.getByText('gonna')).toBeInTheDocument()
    expect(screen.getByText('later')).toBeInTheDocument()
  })

  it('no muestra los detalles de error desplegados inicialmente', () => {
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
      />,
    )

    expect(
      screen.queryByText(/falta \/g\/ · falta \/ɑ\//i),
    ).not.toBeInTheDocument()
  })

  it('abre la descripción del error al hacer clic en una palabra con error', () => {
    speakMock.mockClear()
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
      />,
    )

    const errorWordBtn = screen.getByRole('button', { name: /gonna: error/i })
    fireEvent.click(errorWordBtn)

    expect(
      screen.getByText(/falta \/g\/ · falta \/ɑ\/ · \/n\/ → escuchado \/t\/ · \/ʌ\/ → escuchado \/u:\//i),
    ).toBeInTheDocument()
    expect(speakMock).toHaveBeenCalledWith('gonna')

    // Al hacer clic nuevamente se cierra
    fireEvent.click(errorWordBtn)
    expect(
      screen.queryByText(/falta \/g\/ · falta \/ɑ\//i),
    ).not.toBeInTheDocument()
  })

  it('abre el detalle del fonema y reproduce audio al hacer clic en un fonema con error en la línea IPA', () => {
    playIpaSoundMock.mockClear()
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
      />,
    )

    // Buscar botón de fonema incorrecto
    const phonemeBtn = screen.getByRole('button', { name: /fonema \/n\/.*incorrecto/i })
    fireEvent.click(phonemeBtn)

    expect(playIpaSoundMock).toHaveBeenCalledWith('n')
    expect(
      screen.getByText(/Se esperaba \/n\/ pero se reconoció \/t\//i),
    ).toBeInTheDocument()
  })
})

