'use client'

// Planned structure:
// <WordFoundBanner>
//   <WordPillBadge>
//     <WordText />
//     <IpaText />
//   </WordPillBadge>
//   <PlayAudioCircleButton />
//   <SavedStatusText />
//   <DismissButton />
// </WordFoundBanner>

import type { WordSearchItem } from '@/lib/exercises/word-search/types'
import { Play, X } from '@/components/icons'
import { speakText } from '@/lib/speech/synthesis'

interface Props {
  item: WordSearchItem | null
  onDismiss: () => void
}

export default function WordFoundBanner({ item, onDismiss }: Props) {
  if (!item) return null

  return (
    <aside
      aria-label="Palabra encontrada"
      className="animate-state-in flex w-full flex-wrap items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-500/10 px-2.5 py-1.5 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/40"
    >
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200/90 px-3 py-1 text-caption font-bold text-emerald-950 dark:bg-emerald-900/80 dark:text-emerald-100">
        <span lang="en">{item.displayWord}</span>
        {item.ipa ? (
          <span className="font-ipa text-caption font-normal text-emerald-800 dark:text-emerald-300">
            {item.ipa}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => speakText(item.displayWord)}
        className="focus-ring flex h-7 w-7 items-center justify-center rounded-full bg-fg text-bg shadow-2xs transition-transform active:scale-95 hover:opacity-90"
        aria-label={`Escuchar pronunciación de ${item.displayWord}`}
        title={`Escuchar pronunciación de ${item.displayWord}`}
      >
        <Play className="h-3.5 w-3.5 fill-current ms-0.5" aria-hidden />
      </button>

      <span className="text-caption font-medium text-fg-muted truncate flex-1">
        encontrada y guardada en tu vocabulario
      </span>

      <button
        type="button"
        onClick={onDismiss}
        className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg"
        aria-label="Cerrar aviso de palabra encontrada"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </aside>
  )
}
