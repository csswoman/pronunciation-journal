'use client'

// Planned structure:
// <WordFoundBanner>
//   <BannerStatusIcon />
//   <BannerContentGroup />
//   <BannerActions />
// </WordFoundBanner>

import type { WordSearchItem } from '@/lib/exercises/word-search/types'
import type { WordColorTheme } from '@/lib/exercises/word-search/word-colors'
import { CheckCircle2, X } from '@/components/icons'
import { ListenButton } from '@/components/ui/ListenButton'
import { speakText } from '@/lib/speech/synthesis'

interface Props {
  item: WordSearchItem | null
  colorTheme?: WordColorTheme
  onDismiss: () => void
}

export default function WordFoundBanner({ item, colorTheme, onDismiss }: Props) {
  if (!item) return null

  const cardBg = colorTheme?.cardBg ?? 'bg-surface-raised'
  const cardBorder = colorTheme?.cardBorder ?? 'border-border-subtle'
  const iconBg = colorTheme?.iconBg ?? 'bg-success text-on-primary'

  return (
    <aside
      aria-label="Palabra encontrada"
      className={`animate-state-in flex w-full items-center gap-2.5 rounded-xl border ${cardBorder} ${cardBg} px-3 py-2 shadow-2xs`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-caption font-bold text-fg" lang="en">
            ¡Encontraste {item.displayWord}!
          </span>
          {item.ipa ? (
            <span className="font-ipa text-caption text-fg-muted">{item.ipa}</span>
          ) : null}
          {item.meaningEs ? (
            <span className="text-caption text-fg-subtle truncate">— {item.meaningEs}</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ListenButton
          iconOnly
          className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 text-fg-muted hover:text-fg"
          aria-label={`Escuchar ${item.displayWord}`}
          onPlay={() => speakText(item.displayWord)}
        />
        <button
          type="button"
          onClick={onDismiss}
          className="focus-ring inline-flex min-h-11 min-w-11 sm:min-h-7 sm:min-w-7 items-center justify-center rounded-full text-fg-subtle hover:bg-surface-sunken hover:text-fg"
          aria-label="Cerrar detalle de la palabra"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </aside>
  )
}
