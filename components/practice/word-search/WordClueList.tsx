'use client'

// Planned structure:
// <WordClueList>
//   <CluesHeader />         (título, badge de progreso y kicker sutil)
//   <WordBankContainer />   (rejilla responsiva compacta de 2 columnas con scroll contenido)
//     <FoundWordRow />      (fila compacta reutilizable para palabras ya descubiertas)
//     <WordClueCard />      (tarjeta compacta adaptativa para palabras por descubrir)
// </WordClueList>

import { useState } from 'react'
import type { WordSearchItem, WordSearchMode } from '@/lib/exercises/word-search/types'
import { getWordColorTheme } from '@/lib/exercises/word-search/word-colors'
import { Eye, EyeOff } from '@/components/icons'
import WordSearchFoundRow from './WordSearchFoundRow'

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

  const foundCount = items.filter((i) => i.found).length

  return (
    <section className="flex min-w-0 flex-col gap-2" aria-labelledby="word-search-clues-title">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <h2 id="word-search-clues-title" className="text-label font-bold text-fg">
            {mode === 'classic' ? 'Palabras a buscar' : 'Pistas (Modo Difícil)'}
          </h2>
          <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-mono text-caption font-semibold text-fg-muted">
            {foundCount}/{items.length}
          </span>
        </div>
        <span className="text-caption text-fg-subtle">
          {mode === 'classic' ? 'Reconocimiento visual' : 'Deducción'}
        </span>
      </div>

      <div className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-0.5 scrollbar-thin sm:max-h-[38rem]">
        {mode === 'classic' ? (
          <div className="grid grid-cols-1 gap-2">
            {items.map((item, index) => {
              const isFound = item.found
              const isInspected = activeWordId === item.id
              const colorTheme = getWordColorTheme(index)

              if (isFound) {
                return (
                  <WordSearchFoundRow
                    key={item.id}
                    item={item}
                    isInspected={isInspected}
                    colorTheme={colorTheme}
                    onInspect={() => onInspectWord(isInspected ? null : item.id)}
                  />
                )
              }

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised px-3 py-2 shadow-2xs transition-colors hover:border-border-default hover:bg-surface-sunken/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-sunken font-mono text-caption font-semibold text-fg-subtle"
                      aria-hidden
                    >
                      {index + 1}
                    </span>

                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-body-sm font-bold text-fg" lang="en">
                        {item.displayWord}
                      </span>
                      {item.ipa ? (
                        <span className="font-ipa text-caption text-fg-muted">
                          {item.ipa}
                        </span>
                      ) : null}
                      {item.meaningEs ? (
                        <span className="text-caption text-fg-subtle truncate">
                          — {item.meaningEs}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <ol className="grid grid-cols-1 gap-2">
            {items.map((item, index) => {
              const isFound = item.found
              const isInspected = activeWordId === item.id
              const isHintRevealed = revealedHints.has(item.id)
              const hintId = `word-search-hint-${item.id}`
              const colorTheme = getWordColorTheme(index)

              if (isFound) {
                return (
                  <li key={item.id}>
                    <WordSearchFoundRow
                      item={item}
                      isInspected={isInspected}
                      colorTheme={colorTheme}
                      onInspect={() => onInspectWord(isInspected ? null : item.id)}
                    />
                  </li>
                )
              }

              return (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-border-subtle bg-surface-raised p-3 shadow-2xs transition-colors hover:border-border-default"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-sunken font-mono text-caption font-semibold text-fg-subtle"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <span className="font-mono text-caption font-medium text-fg-muted">
                        {item.word.length} letras
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleHint(item.id)}
                      aria-expanded={isHintRevealed}
                      aria-controls={hintId}
                      className="focus-ring inline-flex min-h-11 sm:min-h-6 items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken px-2 py-0.5 text-caption font-medium text-fg-muted transition-colors hover:bg-surface-base hover:text-fg"
                    >
                      {isHintRevealed ? (
                        <EyeOff className="h-3 w-3" aria-hidden />
                      ) : (
                        <Eye className="h-3 w-3" aria-hidden />
                      )}
                      <span>{isHintRevealed ? 'Ocultar' : 'Pista'}</span>
                    </button>
                  </div>

                  <p lang="en" className="text-pretty text-caption italic text-fg leading-snug line-clamp-2">
                    “{item.clue}”
                  </p>

                  {isHintRevealed ? (
                    <div id={hintId} className="rounded-lg border border-border-subtle/80 bg-surface-sunken/80 px-2 py-1 text-caption text-fg-subtle">
                      {item.ipa ? (
                        <span>
                          Sonido: <strong className="font-ipa text-fg">{item.ipa}</strong>
                        </span>
                      ) : (
                        <span>
                          Empieza por: <strong className="font-mono text-fg">{item.word[0]}</strong>
                        </span>
                      )}
                      {item.meaningEs ? (
                        <span className="ms-1.5 text-fg-subtle">
                          · {item.meaningEs}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
