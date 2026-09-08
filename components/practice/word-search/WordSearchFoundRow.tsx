'use client'

// Planned structure:
// <WordSearchFoundRow>
//   <FoundBadgeCheck />
//   <WordDetailsGroup />
//   <WordActionButtons />
// </WordSearchFoundRow>

import type { WordSearchItem } from '@/lib/exercises/word-search/types'
import type { WordColorTheme } from '@/lib/exercises/word-search/word-colors'
import { Check, Target } from '@/components/icons'
import { ListenButton } from '@/components/ui/ListenButton'
import { speakText } from '@/lib/speech/synthesis'

interface Props {
  item: WordSearchItem
  isInspected: boolean
  colorTheme: WordColorTheme
  onInspect: () => void
}

export default function WordSearchFoundRow({
  item,
  isInspected,
  colorTheme,
  onInspect,
}: Props) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 shadow-2xs transition-[background-color,border-color,box-shadow] duration-150 ${colorTheme.cardBorder} ${colorTheme.cardBg} ${
        isInspected ? 'ring-1 ring-primary/40 shadow-xs' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-caption ${colorTheme.iconBg}`}
          aria-hidden
        >
          <Check className="h-3 w-3" />
        </span>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-body-sm font-bold ${colorTheme.badgeText} line-through decoration-1 opacity-90`}
            lang="en"
          >
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

      <div className="flex shrink-0 items-center gap-0.5">
        <ListenButton
          iconOnly
          className="min-h-11 min-w-11 sm:min-h-7 sm:min-w-7 text-fg-muted hover:text-fg"
          aria-label={`Escuchar ${item.displayWord}`}
          onPlay={() => speakText(item.displayWord)}
        />
        <button
          type="button"
          onClick={onInspect}
          aria-label={
            isInspected
              ? `Dejar de resaltar ${item.displayWord}`
              : `Resaltar ${item.displayWord} en el tablero`
          }
          aria-pressed={isInspected}
          className="focus-ring inline-flex min-h-11 min-w-11 sm:min-h-7 sm:min-w-7 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg active:scale-[0.96]"
        >
          <Target className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

