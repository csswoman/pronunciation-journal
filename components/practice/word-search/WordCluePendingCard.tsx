'use client'

// Planned structure:
// <WordCluePendingCard>
//   <CardHeader>
//     <ClueNumber />
//     <WordShape />        (lista: palabra + IPA · pistas/oído: huecos con letras reveladas)
//     <HintToggle />
//   </CardHeader>
//   <ListenButton />       (solo modo "De oído")
//   <ClueText />           (oculto en modo "De oído" hasta pedir pista)
//   <HintDetail />
// </WordCluePendingCard>

import { useState } from 'react'
import type { WordSearchItem, WordSearchMode } from '@/lib/exercises/word-search/types'
import { speakText } from '@/lib/speech/synthesis'
import { ListenButton } from '@/components/ui/ListenButton'
import { cn } from '@/lib/cn'

interface Props {
  item: WordSearchItem
  index: number
  mode: WordSearchMode
  revealedLetters: number
  isHintTarget: boolean
}

/** "KN____" style mask: revealed letters, then one underscore per hidden letter. */
function maskWord(word: string, revealed: number): string {
  return word
    .split('')
    .map((letter, position) => (position < revealed ? letter : '_'))
    .join(' ')
}

export default function WordCluePendingCard({
  item,
  index,
  mode,
  revealedLetters,
  isHintTarget,
}: Props) {
  const [isHintOpen, setIsHintOpen] = useState(false)
  const clueText = item.meaningEs || item.clue
  const showClue = mode !== 'listen' || isHintOpen

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-2xl border border-border-subtle/80 bg-surface-sunken/40 p-4 shadow-2xs transition-colors hover:bg-surface-sunken/70',
        isHintTarget && 'ring-2 ring-primary/60',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-subtle/80 bg-surface-base font-mono text-caption font-bold text-fg-muted"
            aria-hidden
          >
            {index + 1}
          </span>
          {mode === 'classic' ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-body-sm font-bold text-fg" lang="en">
                {item.displayWord}
              </span>
              {item.ipa ? <span className="font-ipa text-caption text-fg-muted">{item.ipa}</span> : null}
            </span>
          ) : (
            <span className="truncate font-mono text-caption tracking-wider text-fg-subtle">
              <span aria-hidden>{maskWord(item.word, revealedLetters)}</span>
              <span className="sr-only">
                {item.word.length} letras
                {revealedLetters > 0 ? `, empieza por ${item.word.slice(0, revealedLetters)}` : ''}
              </span>
            </span>
          )}
        </div>

        {mode !== 'classic' ? (
          <button
            type="button"
            onClick={() => setIsHintOpen((open) => !open)}
            aria-expanded={isHintOpen}
            className="focus-ring shrink-0 rounded-full border border-border-subtle bg-surface-base px-3.5 py-1 font-sans text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
          >
            Pista
          </button>
        ) : null}
      </div>

      {mode === 'listen' ? (
        <ListenButton
          label={`Escuchar palabra ${index + 1}`}
          onPlay={() => speakText(item.word.toLowerCase())}
          className="w-fit"
        />
      ) : null}

      {showClue ? (
        <p className="text-body-sm font-normal leading-relaxed text-fg">{clueText}</p>
      ) : null}

      {isHintOpen && mode === 'clues' ? (
        <div className="rounded-xl border border-border-subtle bg-surface-base px-3.5 py-2 text-caption text-fg-subtle">
          {item.ipa ? (
            <span>
              Sonido: <strong className="font-ipa text-fg">{item.ipa}</strong>
            </span>
          ) : (
            <span>
              Empieza por: <strong className="font-mono text-fg">{item.word[0].toUpperCase()}</strong>
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
