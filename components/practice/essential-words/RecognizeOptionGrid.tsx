'use client'

// Planned structure:
// <RecognizeOptionGrid>
//   option button × n (numbered 1–4, keyboard shortcuts)
// </RecognizeOptionGrid>

import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { displayEnglishWord } from '@/lib/essential-words/word-display'

interface Props {
  options: string[]
  chosen: string | null
  correctWord: string
  onChoose: (word: string) => void
  disabled?: boolean
}

export function RecognizeOptionGrid({
  options,
  chosen,
  correctWord,
  onChoose,
  disabled = false,
}: Props) {
  useEffect(() => {
    if (chosen || disabled) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      const index = Number(event.key) - 1
      if (index < 0 || index >= options.length) return
      event.preventDefault()
      onChoose(options[index])
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [chosen, disabled, onChoose, options])

  const correctKey = correctWord.toLowerCase()

  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-3">
      {options.map((word, index) => {
        const label = displayEnglishWord(word)
        const isChosen = chosen === word
        const isCorrect = word.toLowerCase() === correctKey
        const showAsCorrect = chosen && isCorrect

        return (
          <button
            key={word}
            type="button"
            onClick={() => onChoose(word)}
            disabled={Boolean(chosen) || disabled}
            aria-label={`${index + 1}. ${label}`}
            className={cn(
              'relative flex min-h-14 items-center justify-center rounded-lg border px-4 py-3',
              'bg-surface text-body font-medium text-fg',
              'border-border transition-colors duration-150 ease-out-quart focus-ring',
              'hover:bg-surface-raised disabled:cursor-not-allowed',
              isChosen && isCorrect && 'border-success bg-success-soft text-fg',
              isChosen && !isCorrect && 'border-primary bg-primary/10',
              showAsCorrect && !isChosen && 'border-success bg-success-soft',
              chosen && !isChosen && !showAsCorrect && 'opacity-60',
            )}
          >
            <span
              className="absolute top-2 left-2.5 font-caption tabular-nums text-fg-muted"
              aria-hidden
            >
              {index + 1}
            </span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
