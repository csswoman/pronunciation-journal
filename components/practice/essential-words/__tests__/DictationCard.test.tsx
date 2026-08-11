// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DictationCard } from '../DictationCard'
import type { EssentialWord } from '@/lib/essential-words/types'
import { selectSentence } from '@/lib/essential-words/sentence-variants'

const audioMocks = vi.hoisted(() => ({ speak: vi.fn(), speakSequence: vi.fn() }))
vi.mock('@/lib/phoneme-practice/tts', () => audioMocks)
vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))
vi.mock('@/lib/essential-words/english-word-validator', () => ({
  isValidEnglishWord: vi.fn(async () => false),
  englishPronunciation: vi.fn(async () => null),
}))
vi.mock('@/components/ui/ListenButton', () => ({
  ListenButton: ({ onPlay, label }: { onPlay: () => void; label: string }) => (
    <button type="button" onClick={onPlay}>{label}</button>
  ),
}))

const entry: EssentialWord = {
  rank: 1,
  word: 'through',
  pos: 'preposition',
  ipa_strong: 'θruː',
  example_sentence: 'We walked through the park.',
  cefr_level: 'A1',
}

describe('DictationCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not reveal the sentence before answering', () => {
    render(<DictationCard entry={entry} onAttempt={vi.fn().mockResolvedValue(undefined)} />)
    expect(screen.queryByText(entry.example_sentence)).not.toBeInTheDocument()
  })

  it('accepts casing and final-punctuation-only differences', async () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<DictationCard entry={entry} onAttempt={onAttempt} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'we walked through the park' } })
    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))
    await waitFor(() => expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true, typo: false, hintsUsed: 0 })))
  })

  it('renders word-level feedback and submits one failed target attempt without a retry action', async () => {
    const targetEntry: EssentialWord = {
      ...entry,
      word: 'he',
      pos: 'pronoun',
      example_sentence: 'Did he finish his homework already?',
    }
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<DictationCard entry={targetEntry} onAttempt={onAttempt} onContinue={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'did you finish your homework alredy?' } })
    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))

    expect(await screen.findByTestId('answer-diff-message')).toHaveTextContent('Did youhe finish yourhis homework alredyalready?')
    expect(screen.queryByRole('button', { name: /intentar de nuevo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.queryByText(/Volverás a ver/)).not.toBeInTheDocument()
    await waitFor(() => expect(onAttempt).toHaveBeenCalledTimes(1))
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: false, typo: true }))
  })

  it('does not penalize a typo outside the target word', async () => {
    const targetEntry: EssentialWord = {
      ...entry,
      word: 'he',
      pos: 'pronoun',
      example_sentence: 'Did he finish his homework already?',
    }
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<DictationCard entry={targetEntry} onAttempt={onAttempt} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Did he finish his homework alredy?' } })
    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))

    expect(await screen.findByTestId('answer-diff-message')).toHaveTextContent('alredyalready')
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true, typo: true }))
  })

  it('does not show a correct result when a non-target word is replaced', async () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<DictationCard entry={entry} onAttempt={onAttempt} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'We walked through the city.' } })
    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))

    expect(await screen.findByLabelText('Oración correcta')).toBeInTheDocument()
    await waitFor(() => expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: false, typo: false })))
  })

  it('grades against the selected variant, not always the base sentence', async () => {
    const withVariants: EssentialWord = {
      ...entry,
      example_sentences: [{ sentence: 'We walked home slowly.', sentence_ipa: '/wi wɔkt hoʊm sloʊli/' }],
    }
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<DictationCard entry={withVariants} repetitions={0} onAttempt={onAttempt} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: selectSentence(withVariants, 0).sentence } })
    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))
    await waitFor(() => expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true })))
  })

  it('keeps normal replay free and records each audio-help rung only once', async () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<DictationCard entry={entry} onAttempt={onAttempt} />)
    fireEvent.click(screen.getByRole('button', { name: /^escuchar$/i }))
    fireEvent.click(screen.getByRole('button', { name: '0.75x' }))
    fireEvent.click(screen.getByRole('button', { name: '0.75x' }))
    fireEvent.click(screen.getByRole('button', { name: /por partes/i }))
    expect(audioMocks.speak).toHaveBeenCalledTimes(3)
    expect(audioMocks.speakSequence).toHaveBeenCalledWith(['We walked through', 'the park.'], { rate: 0.95 })

    fireEvent.change(screen.getByRole('textbox'), { target: { value: entry.example_sentence } })
    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))
    await waitFor(() => expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ hintsUsed: 2 })))
  })

  it('disables browser capitalization, correction and spelling tools on the input', () => {
    render(<DictationCard entry={entry} onAttempt={vi.fn().mockResolvedValue(undefined)} />)
    const input = screen.getByRole('textbox')
    expect(input.tagName).toBe('TEXTAREA')
    expect(input).toHaveAttribute('rows', '3')
    expect(input).toHaveAttribute('autocapitalize', 'none')
    expect(input).toHaveAttribute('autocorrect', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
  })

  it('places the pause action below Comprobar', () => {
    render(<DictationCard entry={entry} onAttempt={vi.fn()} onArchive={vi.fn()} />)

    const check = screen.getByRole('button', { name: 'Comprobar' })
    const pause = screen.getByRole('button', { name: 'Pausar esta palabra' })

    expect(check.compareDocumentPosition(pause) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
