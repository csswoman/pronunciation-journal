'use client'

// Planned structure:
// <LearningFocusTopicItem>
//   <already claimed row | selected button | unselected button>
// </LearningFocusTopicItem>

import { Check } from '@/components/icons'

type LearningFocusTopicItemProps = {
  slug: string
  title: string
  keywords?: string
  alreadyClaimed: boolean
  isSelected: boolean
  onToggle: (slug: string) => void
}

export function LearningFocusTopicItem({
  slug,
  title,
  keywords,
  alreadyClaimed,
  isSelected,
  onToggle,
}: LearningFocusTopicItemProps) {
  if (alreadyClaimed) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
            <Check size={13} strokeWidth={2.8} />
          </span>
          <span className="truncate text-body font-medium text-fg">{title}</span>
        </div>
        <span className="shrink-0 text-caption text-fg-muted">En tu perfil</span>
      </div>
    )
  }

  if (isSelected) {
    return (
      <button
        type="button"
        onClick={() => onToggle(slug)}
        className="flex items-start gap-3 rounded-xl border border-(--accent-pink)/40 bg-(--accent-pink)/10 p-3.5 text-left transition-colors"
      >
        <span className="mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-md bg-(--accent-pink) text-white shadow-xs">
          <Check size={14} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold text-fg">{title}</span>
          {keywords ? (
            <span className="mt-0.5 block text-caption text-fg-muted">{keywords}</span>
          ) : null}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(slug)}
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
    >
      <span className="mt-0.5 size-5.5 shrink-0 rounded-md border border-border-strong bg-transparent" />
      <span className="min-w-0 flex-1">
        <span className="block text-body text-fg">{title}</span>
        {keywords ? (
          <span className="mt-0.5 block text-caption text-fg-muted">{keywords}</span>
        ) : null}
      </span>
    </button>
  )
}
