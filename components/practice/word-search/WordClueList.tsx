'use client'

import { useState } from 'react'
import type { WordSearchItem, WordSearchMode } from '@/lib/exercises/word-search/types'
import { Check, Eye, EyeOff, Target } from '@/components/icons'
import { ListenButton } from '@/components/ui/ListenButton'
import { speakText } from '@/lib/speech/synthesis'

interface Props {
  items: WordSearchItem[]
  mode: WordSearchMode
  activeWordId: string | null
  onInspectWord: (wordId: string | null) => void
}

export default function WordClueList({
  items,
  mode,
  activeWordId,
  onInspectWord,
}: Props) {
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set())

  const toggleHint = (id: string) => {
    setRevealedHints((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="word-search-clues-title">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="word-search-clues-title" className="text-h4 text-fg">
            {mode === 'classic' ? 'Palabras' : 'Pistas'}
          </h2>
          <p className="text-body-sm text-fg-muted">
            {mode === 'classic'
              ? 'Selecciona cada palabra en el tablero.'
              : 'Usa la ayuda solo cuando la necesites.'}
          </p>
        </div>
      </div>

      <ol className="grid grid-cols-1 gap-2.5">
        {items.map((item, index) => {
          const isFound = item.found
          const isInspected = activeWordId === item.id
          const isHintRevealed = revealedHints.has(item.id)
          const hintId = `word-search-hint-${item.id}`

          return (
            <li
              key={item.id}
              className={`flex flex-col gap-2.5 rounded-lg border p-3 transition-[background-color,border-color] duration-150 ease-out-quart ${
                isInspected
                  ? 'border-primary bg-primary-soft'
                  : isFound
                    ? 'border-success/30 bg-success-soft/20'
                    : 'border-border-subtle bg-surface-raised'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-caption ${
                    isFound
                      ? 'bg-success text-on-primary'
                      : 'border border-border-subtle bg-surface-sunken text-fg-subtle'
                  }`}
                  aria-hidden
                >
                  {isFound ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  {mode === 'classic' || isFound ? (
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span
                        className={`text-label font-semibold text-fg ${
                          isFound && !isInspected ? 'line-through decoration-success/70' : ''
                        }`}
                        lang="en"
                      >
                        {item.displayWord}
                      </span>
                      {item.ipa ? (
                        <span className="font-ipa text-caption text-fg-muted">
                          {item.ipa}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="font-mono text-caption tracking-widest text-fg-muted">
                      {item.word.split('').map(() => '•').join(' ')}{' '}
                      <span className="whitespace-nowrap tracking-normal text-fg-subtle">
                        ({item.word.length} letras)
                      </span>
                    </span>
                  )}
                </div>

                {isFound ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <ListenButton
                      iconOnly
                      className="min-h-11 min-w-11"
                      aria-label={`Escuchar ${item.displayWord}`}
                      onPlay={() => speakText(item.displayWord)}
                    />
                    <button
                      type="button"
                      onClick={() => onInspectWord(isInspected ? null : item.id)}
                      aria-label={
                        isInspected
                          ? `Dejar de resaltar ${item.displayWord}`
                          : `Resaltar ${item.displayWord} en el tablero`
                      }
                      aria-pressed={isInspected}
                      className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-subtle text-fg-muted transition-[background-color,color,transform] duration-150 ease-out-quart hover:bg-surface-sunken hover:text-fg active:scale-[0.96] motion-reduce:transform-none"
                    >
                      <Target className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </div>

              {mode === 'clues' && !isFound ? (
                <div className="flex flex-col gap-2 ps-8">
                  <p lang="en" className="text-pretty text-body-sm italic text-fg-muted">
                    “{item.clue}”
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleHint(item.id)}
                    aria-expanded={isHintRevealed}
                    aria-controls={hintId}
                    className="focus-ring inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-caption font-medium text-fg-muted transition-colors hover:text-primary"
                  >
                    {isHintRevealed ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span>{isHintRevealed ? 'Ocultar ayuda' : 'Necesito una ayuda'}</span>
                  </button>
                  {isHintRevealed ? (
                    <div id={hintId} className="flex flex-col gap-1.5 rounded-md bg-surface-sunken p-2.5">
                      <p className="text-caption text-fg-muted">
                        {item.ipa ? (
                          <>
                            Sonido:{' '}
                            <span className="font-ipa text-caption text-fg">
                              {item.ipa}
                            </span>
                          </>
                        ) : (
                          <>
                            Empieza por{' '}
                            <span className="font-mono font-semibold text-fg">
                              {item.word[0]}
                            </span>
                          </>
                        )}
                      </p>
                      {item.meaningEs ? (
                        <p className="text-caption text-fg-muted">
                          Significado: <span className="font-medium text-fg">{item.meaningEs}</span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-1 ps-8">
                  {item.meaningEs ? (
                    <p className="text-body-sm font-medium text-fg-muted">
                      {item.meaningEs}
                    </p>
                  ) : null}
                  {isFound && item.exampleSentence ? (
                    <p lang="en" className="line-clamp-2 text-pretty text-caption italic text-fg-subtle">
                      “{item.exampleSentence}”
                    </p>
                  ) : null}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
