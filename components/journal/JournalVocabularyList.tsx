'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { ResolvedSeedWord } from '@/lib/journal/scaffold-resolver'
import { normalizeHintTokens } from '@/lib/journal/writing-hints/seed-progress'

export function JournalVocabularyList({
  words,
  usedKeys,
}: {
  words: ResolvedSeedWord[]
  usedKeys: Set<string>
}) {
  const ownedKeys = new Set(words.filter((word) => word.inWordBank).map((word) => wordKey(word.text)))
  const [expandedWords, setExpandedWords] = useState<Set<string>>(() => new Set(ownedKeys))

  useEffect(() => {
    setExpandedWords(new Set(ownedKeys))
  }, [words])

  function toggleWord(word: ResolvedSeedWord) {
    const key = wordKey(word.text)
    setExpandedWords((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <ul className="mt-3 flex flex-col divide-y divide-border-subtle">
      {words.map((word) => {
        const key = wordKey(word.text)
        const expanded = expandedWords.has(key)
        const isOwned = word.inWordBank
        const isUsed = usedKeys.has(key)
        const status = [
          isOwned ? 'ya está en tu vocabulario' : null,
          isUsed ? 'usada en este texto' : null,
        ]
          .filter(Boolean)
          .join(' · ')
        return (
          <li key={word.text} className="py-1">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => toggleWord(word)}
              className={cn(
                'focus-ring flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 text-left font-body-sm transition-colors',
                isUsed && 'bg-success-soft/30',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-fg-muted',
                  isUsed && 'bg-success text-on-primary',
                  !isUsed && isOwned && 'bg-primary-soft text-primary',
                )}
                aria-hidden
              >
                {isOwned || isUsed ? <Check size={12} strokeWidth={3} /> : null}
              </span>
              <span className={cn('min-w-0 flex-1 truncate', isOwned || isUsed ? 'font-medium text-fg' : 'text-fg')}>
                {word.text} <span className="text-fg-muted">· {word.translation}</span>
              </span>
              {isUsed && (
                <span className="shrink-0 rounded-full bg-success-soft px-1.5 py-0.5 font-body-xs font-semibold text-success">
                  Usada
                </span>
              )}
              <ChevronDown
                size={14}
                className={cn('shrink-0 text-fg-subtle transition-transform', expanded && 'rotate-180')}
                aria-hidden
              />
              <span className="sr-only">
                {status ? `, ${status}` : ''}. {expanded ? 'Ocultar detalles' : 'Mostrar detalles'}
              </span>
            </button>
            {expanded ? (
              <div className="ml-9 pb-2 pr-5 font-body-xs text-fg-muted">
                <p className="font-ipa text-caption text-primary">{word.ipa}</p>
                <p className="mt-1 leading-normal">{word.example}</p>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function wordKey(text: string): string {
  return normalizeHintTokens(text).join(' ')
}
