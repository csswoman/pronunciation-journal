// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { WordFeedbackPanel } from '../WordFeedbackPanel'
import type { WordFeedback, WordFix } from '@/lib/pronunciation/feedback/word-feedback'

const playIpaSound = vi.fn()
vi.mock('@/lib/pronunciation/ipa-audio', () => ({ playIpaSound: (...a: unknown[]) => playIpaSound(...a) }))
const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...a: unknown[]) => speak(...a) }))

function fix(ipa: string, over: Partial<WordFix> = {}): WordFix {
  return {
    ipa,
    diag: [{ text: `Diag de ${ipa}.` }],
    diagPlain: `Diag de ${ipa}.`,
    title: `Título ${ipa}`,
    steps: [`Paso uno ${ipa}`, `Paso dos ${ipa}`],
    tip: `Tip ${ipa}`,
    minimalPairs: [],
    ...over,
  }
}

const words: WordFeedback[] = [
  { text: "I'm", state: 'bad', extra: false, fix: fix('/aɪ/'), note: null },
  { text: 'looking', state: 'almost', extra: false, fix: fix('/ʊ/'), note: null },
  { text: 'to', state: 'good', extra: false, fix: null, note: null },
]

beforeEach(() => {
  playIpaSound.mockReset()
  speak.mockReset()
})

describe('WordFeedbackPanel', () => {
  it('summarises how many words went well and shows the legend in full', () => {
    render(<WordFeedbackPanel words={words} />)
    expect(screen.getByText('1 de 3 palabras bien')).toBeInTheDocument()
    expect(screen.getByText('No se oyó', { selector: 'li' })).toBeInTheDocument()
  })

  it('hides legend, footer and keeps «Cómo se hace» folded in compact', () => {
    render(<WordFeedbackPanel words={words} variant="compact" onRetry={vi.fn()} onContinue={vi.fn()} />)
    expect(screen.queryByText('No se oyó', { selector: 'li' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /repetir/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cómo se hace/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Paso uno /aɪ/')).not.toBeInTheDocument()
  })

  it('opens the first word to improve with its sound and steps', () => {
    render(<WordFeedbackPanel words={words} />)
    expect(screen.getByText('El sonido')).toBeInTheDocument()
    expect(screen.getByText('Título /aɪ/')).toBeInTheDocument()
    expect(screen.getByText('Diag de /aɪ/.')).toBeInTheDocument()
    expect(screen.getByText('Paso uno /aɪ/')).toBeInTheDocument()
    expect(screen.getByText('Tip /aɪ/')).toBeInTheDocument()
  })

  it('switches the diagnosis when another failed word is selected', () => {
    render(<WordFeedbackPanel words={words} />)
    fireEvent.click(screen.getByRole('button', { name: /looking: casi/i }))
    expect(screen.getByText('Diag de /ʊ/.')).toBeInTheDocument()
    expect(screen.queryByText('Diag de /aɪ/.')).not.toBeInTheDocument()
  })

  it('does not make good words interactive', () => {
    render(<WordFeedbackPanel words={words} />)
    expect(screen.queryByRole('button', { name: /^to:/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText('to: bien')).toBeInTheDocument()
  })

  it('plays the isolated sound, falling back to the word', () => {
    playIpaSound.mockReturnValueOnce(null)
    render(<WordFeedbackPanel words={words} />)
    fireEvent.click(screen.getByRole('button', { name: 'Escuchar /aɪ/' }))
    expect(playIpaSound).toHaveBeenCalledWith('/aɪ/')
    expect(speak).toHaveBeenCalledWith("I'm")
  })

  it('only offers «Tu intento» when there is a recording', () => {
    const { rerender } = render(<WordFeedbackPanel words={words} />)
    expect(screen.queryByRole('button', { name: /escuchar tu intento/i })).not.toBeInTheDocument()
    rerender(<WordFeedbackPanel words={words} userAudioUrl="blob:x" />)
    expect(screen.getByRole('button', { name: /escuchar tu intento/i })).toBeInTheDocument()
  })

  it('walks failed words with «Siguiente a mejorar», then continues', () => {
    const onContinue = vi.fn()
    render(<WordFeedbackPanel words={words} onRetry={vi.fn()} onContinue={onContinue} />)

    fireEvent.click(screen.getByRole('button', { name: /siguiente a mejorar/i }))
    expect(screen.getByText('Diag de /ʊ/.')).toBeInTheDocument()
    expect(onContinue).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('retries the whole phrase', () => {
    const onRetry = vi.fn()
    render(<WordFeedbackPanel words={words} onRetry={onRetry} onContinue={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /repetir frase/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('explains words without a locatable sound using the note', () => {
    render(
      <WordFeedbackPanel
        words={[{ text: 'forward', state: 'bad', extra: false, fix: null, note: 'No se te oyó «forward».' }]}
      />,
    )
    expect(screen.getByText('No se te oyó «forward».')).toBeInTheDocument()
    expect(screen.getByText('La palabra «forward»')).toBeInTheDocument()
  })

  it('renders nothing diagnostic when every word is good', () => {
    render(<WordFeedbackPanel words={[words[2]]} />)
    expect(screen.getByText('1 de 1 palabras bien')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cómo se hace/i })).not.toBeInTheDocument()
  })
})
