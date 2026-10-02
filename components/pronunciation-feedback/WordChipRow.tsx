'use client'

// Planned structure:
// <WordChipRow>
//   <WordChip />   (una pastilla por palabra; las fallidas son seleccionables)

import { cn } from '@/lib/cn'
import type { WordFeedback } from '@/lib/pronunciation/feedback/word-feedback'
import { WORD_TONE } from './word-feedback-tone'

interface Props {
  words: WordFeedback[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function WordChipRow({ words, selectedIndex, onSelect }: Props) {
  return (
    <div data-testid="spoken-line" role="group" aria-label="Palabras de la frase" className="flex flex-wrap gap-2">
      {words.map((word, index) => (
        <WordChip
          key={index}
          word={word}
          selected={index === selectedIndex}
          onSelect={() => onSelect(index)}
        />
      ))}
    </div>
  )
}

function WordChip({
  word,
  selected,
  onSelect,
}: {
  word: WordFeedback
  selected: boolean
  onSelect: () => void
}) {
  const tone = WORD_TONE[word.state]
  const label = word.extra ? 'sobra' : tone.label.toLowerCase()
  const className = cn(
    'inline-flex min-h-11 flex-col items-center justify-center rounded-2xl px-4 py-1.5',
    'font-display text-lg font-bold leading-tight text-ink select-none',
    tone.fill,
    word.extra && 'line-through',
  )
  const smile = (
    <svg className="mt-0.5 h-1.5 w-6 text-ink-muted" viewBox="0 0 24 6" aria-hidden="true">
      <path d="M2 2C8 5 16 5 22 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )

  if (word.state === 'good') {
    return (
      <span aria-label={`${word.text}: ${label}`} className={className}>
        {word.text}
        {smile}
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${word.text}: ${label}`}
      onClick={onSelect}
      className={cn(
        className,
        'cursor-pointer transition-transform focus-ring',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-surface-base',
      )}
    >
      {word.text}
      {smile}
    </button>
  )
}
