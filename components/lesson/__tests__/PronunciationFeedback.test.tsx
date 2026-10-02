// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PronunciationFeedback from '../PronunciationFeedback'
import type { WordResult } from '@/lib/types'

vi.mock('@/lib/pronunciation/ipa-audio', () => ({
  playIpaSound: vi.fn(),
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
  it('renderiza la puntuación, feedback y las palabras de la frase', () => {
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
      />,
    )

    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getAllByText(/Bien/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('+5 XP')).toBeInTheDocument()
    expect(screen.getByLabelText(/i'm: bien/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gonna:/ })).toBeInTheDocument()
    expect(screen.getByLabelText(/later: bien/)).toBeInTheDocument()
  })

  it('abre el diagnóstico de la primera palabra fallada sin pulsar nada', () => {
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
      />,
    )

    // «gonna» es la única fallada: queda seleccionada y su diagnóstico visible.
    expect(screen.getByRole('button', { name: /gonna: (casi|no se oyó)/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/en «gonna»/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar \//i })).toBeInTheDocument()
  })

  it('las palabras correctas no son interactivas', () => {
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
      />,
    )

    expect(screen.queryByRole('button', { name: /^later:/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/later: bien/i)).toBeInTheDocument()
  })

  it('en variante compacta pliega «Cómo se hace» y oculta la leyenda', () => {
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={60}
        feedback={{ message: 'Bien', emoji: '👍', color: 'text-warning' }}
        xpEarned={5}
        variant="compact"
      />,
    )

    expect(screen.queryByText('No se oyó', { selector: 'li' })).not.toBeInTheDocument()
  })

  it('renders SelfPlaybackAudioBar when userAudioUrl is provided', () => {
    render(
      <PronunciationFeedback
        wordResults={sampleWordResults}
        accuracy={75}
        feedback={{ message: 'Buen intento', emoji: '👍', color: 'text-warning' }}
        xpEarned={10}
        userAudioUrl="blob:http://localhost/test-audio"
      />,
    )

    expect(screen.getByText('Comparación de Audio')).toBeInTheDocument()
    expect(screen.getAllByText('Nativo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Mi voz')).toBeInTheDocument()
  })
})

