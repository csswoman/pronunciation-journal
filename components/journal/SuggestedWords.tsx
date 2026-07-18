'use client'

import { useState } from 'react'
import { Check, Plus } from '@/components/icons'
import { quickAddWord } from '@/lib/word-bank/queries'
import { cn } from '@/lib/cn'

type WordState = 'idle' | 'adding' | 'added' | 'error'

/**
 * Opt-in suggested-word bank. Saving a word is explicit and independent per
 * candidate; one failure never reverts the correction or the other words.
 */
export function SuggestedWords({ words }: { words: string[] }) {
  const unique = [...new Set(words.map((w) => w.trim()).filter(Boolean))]
  const [states, setStates] = useState<Record<string, WordState>>({})

  if (unique.length === 0) return null

  async function add(word: string) {
    setStates((prev) => ({ ...prev, [word]: 'adding' }))
    try {
      await quickAddWord({ text: word, source: 'manual' })
      setStates((prev) => ({ ...prev, [word]: 'added' }))
    } catch {
      setStates((prev) => ({ ...prev, [word]: 'error' }))
    }
  }

  return (
    <section aria-labelledby="journal-suggested-words" className="flex flex-col gap-2">
      <h3 id="journal-suggested-words" className="font-body-sm font-semibold text-fg">
        Palabras sugeridas
      </h3>
      <p className="font-body-sm text-fg-muted">
        Guarda solo las que quieras practicar. No se añaden automáticamente.
      </p>
      <ul className="flex flex-wrap gap-2">
        {unique.map((word) => {
          const state = states[word] ?? 'idle'
          const added = state === 'added'
          return (
            <li key={word}>
              <button
                type="button"
                onClick={() => void add(word)}
                disabled={state === 'adding' || added}
                aria-pressed={added}
                className={cn(
                  'focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body-sm transition-colors',
                  added
                    ? 'border-success-border bg-success-soft text-success'
                    : 'border-border-default bg-surface-raised text-fg hover:border-primary',
                  state === 'error' && 'border-error-border text-error',
                )}
              >
                {added ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />}
                {word}
                <span className="sr-only">
                  {added
                    ? ' guardada en tu banco de palabras'
                    : state === 'error'
                      ? ' no se pudo guardar, reintentar'
                      : ' añadir a tu banco de palabras'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
