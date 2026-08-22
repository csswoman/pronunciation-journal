'use client'

import type { WordSearchItem } from '@/lib/exercises/word-search/types'
import { CheckCircle2, X } from '@/components/icons'
import { ListenButton } from '@/components/ui/ListenButton'
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
      className="animate-state-in flex w-full items-start gap-3 rounded-lg border border-success/30 bg-success-soft p-3"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-on-primary">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-label font-bold text-fg" lang="en">
            {item.displayWord}
          </span>
          {item.ipa ? (
            <span className="font-ipa text-caption text-fg-muted">{item.ipa}</span>
          ) : null}
          {item.meaningEs ? (
            <span className="text-caption text-fg-muted">— {item.meaningEs}</span>
          ) : null}
        </div>
        {item.exampleSentence ? (
          <p lang="en" className="mt-1 max-w-prose text-pretty text-caption italic text-fg-muted">
            “{item.exampleSentence}”
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ListenButton
          iconOnly
          className="min-h-11 min-w-11"
          aria-label={`Escuchar ${item.displayWord}`}
          onPlay={() => speakText(item.displayWord)}
        />
        <button
          type="button"
          onClick={onDismiss}
          className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-fg-subtle transition-[background-color,color,transform] duration-150 ease-out-quart hover:bg-surface-raised hover:text-fg active:scale-[0.96] motion-reduce:transform-none"
          aria-label="Cerrar detalle de la palabra"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </aside>
  )
}
