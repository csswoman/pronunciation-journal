'use client'

import { cn } from '@/lib/cn'
import { splitSpokenWords } from '@/lib/speech/word-timings'

interface Props {
  text: string
  /** Indice de la palabra que suena ahora, o null si no suena nada. */
  activeIndex: number | null
}

export function SpokenLine({ text, activeIndex }: Props) {
  const words = splitSpokenWords(text)

  return (
    <span data-testid="spoken-script-line" className="inline">
      {words.map((word, index) => {
        const isActive = activeIndex === index
        return (
          <span key={`${word}-${index}`}>
            <span
              data-active={isActive ? 'true' : 'false'}
              className={cn(
                'inline-block rounded-lg transition-colors duration-150 motion-reduce:transition-none',
                isActive
                  ? 'bg-[var(--butter,#fef08a)] text-[var(--ink,#1c1917)] px-2 py-0.5 font-extrabold shadow-2xs'
                  : 'text-fg',
              )}
            >
              {word}
            </span>
            {index < words.length - 1 ? ' ' : null}
          </span>
        )
      })}
    </span>
  )
}
