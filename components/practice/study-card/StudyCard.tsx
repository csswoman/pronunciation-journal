'use client'

// Planned structure:
// <StudyCard>
//   <contextLine /> | <srsBadge />
//   <StudyCardBody />
//   <PracticeActionBar /> — Continuar + omit / archive
// </StudyCard>

import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import { ArchiveConfirmAction } from './ArchiveConfirmAction'
import { StudyCardBody } from './StudyCardBody'
import { cn } from '@/lib/cn'
import type { StudyCardModel } from '@/lib/practice/study-card/model'
import type { ListenTarget } from './listen-target'

export type { ListenTarget }

interface Props {
  model: StudyCardModel
  onContinue: () => void
  onListen: (target: ListenTarget) => void
  /** Plays validated study content; its default text is compiled from the visible copy. */
  onListenText?: (text: string) => void
  /** Primary CTA label. Default Continuar (first-look); pass Practicar for legacy intros. */
  continueLabel?: string
  /** Immersive essential-words study mode: flat layout, no nested card chrome. */
  variant?: 'default' | 'immersive'
  /** Session context above the word (e.g. block progress). */
  contextLine?: string
  /** Deferred verification: skip in-block practice, verify near session end. */
  onOmit?: () => void
  /** Copy for the low-emphasis skip action. */
  omitLabel?: string
  /** Immediate archive ("Ya la sé"). Prefer onOmit for essential-words first-look. */
  onArchive?: () => void
}

export function StudyCard({
  model,
  onContinue,
  onListen,
  onListenText,
  continueLabel = 'Continuar',
  variant = 'default',
  contextLine,
  onOmit,
  // "Sáltala" prometía omitir y luego se verificaba igualmente. El claim abre
  // una comprobación corta, por eso el copy no promete saltarse la palabra.
  omitLabel = 'Ya conozco esta palabra',
  onArchive,
}: Props) {
  const immersive = variant === 'immersive'

  const body = (
    <>
      {immersive && contextLine ? (
        <p className="m-0 text-center text-caption text-fg-muted">{contextLine}</p>
      ) : null}
      {model.srsBadge ? (
        <span className="font-kicker text-primary">{model.srsBadge}</span>
      ) : null}
      <StudyCardBody model={model} onListen={onListen} onListenText={onListenText} immersive={immersive} />
    </>
  )

  return (
    <div className={cn('flex w-full flex-col items-center', immersive ? 'gap-layout-stack' : 'gap-[var(--layout-stack-loose)]')}>
      {immersive ? (
        body
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-[var(--layout-stack)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad sm:gap-[var(--space-5)]">
          <div className="flex flex-col items-center gap-[var(--layout-stack-tight)]">
            {body}
          </div>
        </div>
      )}

      <PracticeActionBar className={immersive ? undefined : 'max-w-sm'}>
        <PracticeContinueButton onClick={onContinue}>{continueLabel}</PracticeContinueButton>
        {onOmit ? (
          <button
            type="button"
            onClick={onOmit}
            className="mt-1 inline-flex min-h-11 min-w-11 self-center items-center justify-center rounded-lg border-none bg-transparent px-3 py-2 text-body-sm font-normal text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
          >
            {omitLabel}
          </button>
        ) : null}
        {!onOmit && onArchive ? <ArchiveConfirmAction onArchive={onArchive} /> : null}
      </PracticeActionBar>
    </div>
  )
}
