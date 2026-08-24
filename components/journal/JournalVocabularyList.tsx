'use client'

import { Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { ResolvedSeedWord } from '@/lib/journal/scaffold-resolver'
import { normalizeHintTokens } from '@/lib/journal/writing-hints/seed-progress'

// Planned structure:
// <JournalVocabularyList>
//   <header: label + counter />
//   <chip-grid />
// </JournalVocabularyList>

export function JournalVocabularyList({
  words,
  usedKeys,
}: {
  words: ResolvedSeedWord[]
  usedKeys: Set<string>
}) {
  const usedCount = words.filter((w) => usedKeys.has(wordKey(w.text))).length

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="font-body-sm font-semibold text-fg">Palabras de hoy</span>
        <span className="font-body-xs text-fg-muted">
          {usedCount} de {words.length}
        </span>
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="Vocabulario objetivo">
        {words.map((word) => {
          const key = wordKey(word.text)
          const isUsed = usedKeys.has(key)
          const isOwned = word.inWordBank
          return (
            <li key={word.text}>
              <span
                title={`${word.translation} — ${word.example}`}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body-sm transition-colors',
                  isUsed
                    ? 'bg-primary text-on-primary'
                    : isOwned
                      ? 'border border-primary/30 bg-primary-soft/50 text-fg'
                      : 'border border-border-default bg-surface-sunken text-fg',
                )}
              >
                {isUsed && (
                  <Check
                    size={11}
                    strokeWidth={3}
                    className="shrink-0"
                    aria-hidden
                  />
                )}
                {word.text}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function wordKey(text: string): string {
  return normalizeHintTokens(text).join(' ')
}
