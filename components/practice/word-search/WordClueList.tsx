'use client'

// Planned structure:
// <WordClueList>
//   <CluesHeader>
//     <CluesTitleGroup />
//     <RevealLetterButton />
//   </CluesHeader>
//   <CluesScrollArea>
//     <ClueCardFound />
//     <WordCluePendingCard />
//   </CluesScrollArea>
//   <CluesFooter />
// </WordClueList>

import type { WordSearchItem, WordSearchMode } from '@/lib/exercises/word-search/types'
import type { WordSearchHintProgress } from '@/lib/exercises/word-search/hints'
import { PillButton } from '@/components/ui/PillButton'
import { Check } from '@/components/icons'
import WordCluePendingCard from './WordCluePendingCard'

interface Props {
  items: WordSearchItem[]
  mode: WordSearchMode
  activeWordId: string | null
  hintTargetId: string | null
  hintProgress: WordSearchHintProgress
  onInspectWord: (wordId: string | null) => void
  onRevealLetter?: () => void
}

export default function WordClueList({
  items,
  mode,
  activeWordId,
  hintTargetId,
  hintProgress,
  onInspectWord,
  onRevealLetter,
}: Props) {
  const foundCount = items.filter((i) => i.found).length
  const unfoundCount = items.length - foundCount

  return (
    <section
      className="flex w-full min-w-0 flex-col justify-between gap-4 rounded-3xl border border-border-subtle bg-surface-raised p-5 sm:p-6 shadow-sm"
      aria-labelledby="word-search-clues-title"
    >
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-border-subtle/40">
        <div className="flex items-center gap-2.5">
          <h2
            id="word-search-clues-title"
            className="font-mono text-caption font-bold uppercase tracking-wider text-fg-subtle"
          >
            PISTAS
          </h2>
          <span className="inline-flex items-center rounded-full bg-surface-sunken border border-border-subtle/50 px-3 py-0.5 font-mono text-caption font-semibold text-fg-muted">
            {foundCount} de {items.length}
          </span>
        </div>

        {onRevealLetter && mode !== 'classic' ? (
          <PillButton
            variant="outline"
            size="sm"
            onClick={onRevealLetter}
            disabled={unfoundCount === 0}
            className="rounded-full px-3.5 py-1 text-caption font-semibold hover:bg-surface-sunken"
          >
            Ver una letra
          </PillButton>
        ) : null}
      </div>

      <div className="flex max-h-[32rem] sm:max-h-[36rem] flex-col gap-3 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-border-strong/40 scrollbar-track-transparent">
        {items.map((item, index) => {
          const isFound = item.found
          const isInspected = activeWordId === item.id

          if (isFound) {
            return (
              <div
                key={item.id}
                onClick={() => onInspectWord(isInspected ? null : item.id)}
                className={`flex cursor-pointer flex-col gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-2xs transition-colors dark:border-emerald-700/40 dark:bg-emerald-950/40 ${
                  isInspected ? 'ring-2 ring-emerald-500/60' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950">
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
                  </span>
                  <span className="text-body-md font-bold text-fg" lang="en">
                    {item.displayWord}
                  </span>
                  {item.ipa ? (
                    <span className="font-ipa text-caption text-fg-muted">{item.ipa}</span>
                  ) : null}
                </div>
                <p className="text-caption leading-relaxed text-fg-muted">
                  {item.meaningEs || item.clue}
                </p>
              </div>
            )
          }

          return (
            <WordCluePendingCard
              key={item.id}
              item={item}
              index={index}
              mode={mode}
              revealedLetters={hintProgress[item.id] ?? 0}
              isHintTarget={hintTargetId === item.id}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 pt-2.5 text-caption text-fg-subtle border-t border-border-subtle/40">
        <span>
          {unfoundCount > 0 ? `Te faltan ${unfoundCount}` : '¡Todas las palabras encontradas!'}
        </span>
        <span>
          {mode === 'listen'
            ? 'Escucha cada palabra y búscala en el tablero.'
            : 'Las definiciones van en español; las palabras, en inglés.'}
        </span>
      </div>
    </section>
  )
}
