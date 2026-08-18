'use client'

import React, { useState } from 'react'
import type { WordSearchItem, WordSearchMode } from '@/lib/exercises/word-search/types'
import { Check, Eye } from '@/components/icons'
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

  const toggleHint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRevealedHints((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const foundCount = items.filter((i) => i.found).length

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="font-kicker text-fg-muted">
          {mode === 'classic' ? 'Palabras a buscar' : 'Pistas por descifrar'}
        </span>
        <span className="rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-1 font-mono text-caption font-medium text-fg-muted">
          {foundCount} / {items.length} encontradas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {items.map((item, index) => {
          const isFound = item.found
          const isInspected = activeWordId === item.id
          const isHintRevealed = revealedHints.has(item.id)

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isFound) {
                  onInspectWord(isInspected ? null : item.id)
                }
              }}
              className={`
                flex flex-col justify-between gap-layout-stack-tight rounded-lg border p-layout-card-pad transition-all
                ${
                  isFound
                    ? isInspected
                      ? 'bg-primary-soft/40 border-primary/50 shadow-sm cursor-pointer ring-1 ring-primary/30'
                      : 'bg-success-soft/20 border-success/30 cursor-pointer hover:bg-success-soft/30'
                    : 'bg-surface-raised border-border-subtle'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono shrink-0
                      ${
                        isFound
                          ? 'bg-success text-on-primary font-bold'
                          : 'bg-surface-sunken text-fg-subtle border border-border-subtle'
                      }
                    `}
                  >
                    {isFound ? <Check className="w-3 h-3" /> : index + 1}
                  </span>

                  {mode === 'classic' ? (
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-label font-semibold truncate ${
                          isFound ? 'text-fg line-through opacity-80' : 'text-fg'
                        }`}
                      >
                        {item.displayWord}
                      </span>
                      {item.ipa && (
                        <span className="font-ipa text-caption text-fg-muted">
                          {item.ipa}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col min-w-0">
                      {isFound ? (
                        <div className="flex items-center gap-2">
                          <span className="text-label font-semibold text-fg">
                            {item.displayWord}
                          </span>
                          {item.ipa && (
                            <span className="font-ipa text-caption text-fg-muted">
                              {item.ipa}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-caption tracking-widest text-fg-muted">
                          {item.word.split('').map(() => '•').join(' ')}{' '}
                          <span className="text-caption text-fg-subtle">
                            ({item.word.length} letras)
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isFound && (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <ListenButton onPlay={() => speakText(item.displayWord)} />
                  </div>
                )}
              </div>

              {/* Clue / Definition */}
              <div className="text-body-sm text-fg-muted">
                {mode === 'clues' && !isFound ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="line-clamp-2 italic">
                      &ldquo;{item.clue}&rdquo;
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      {isHintRevealed ? (
                        <span className="rounded-md bg-primary-soft/50 px-2 py-0.5 font-ipa text-caption text-primary">
                          {item.ipa ? `Sonido: ${item.ipa}` : `Comienza con: ${item.word[0]}`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleHint(item.id, e)}
                          className="inline-flex items-center gap-1 text-caption text-fg-subtle hover:text-primary transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver pista fonética</span>
                        </button>
                      )}
                      {item.meaningEs && isHintRevealed && (
                        <span className="text-caption text-fg-subtle">
                          {item.meaningEs}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {item.meaningEs && (
                      <p className="text-body-sm font-medium text-fg-muted">
                        {item.meaningEs}
                      </p>
                    )}
                    {isFound && item.exampleSentence && (
                      <p className="text-caption text-fg-subtle italic line-clamp-2">
                        &ldquo;{item.exampleSentence}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
