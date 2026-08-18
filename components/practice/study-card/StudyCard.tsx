'use client'

// Planned structure:
// <StudyCard>
//   <contextLine /> | <srsBadge />
//   <StudyCardBody />
//   <PracticeActionBar /> — Continuar + omit / archive
// </StudyCard>

import { useState } from 'react'
import { MoreVertical, Sparkles, Loader2 } from '@/components/icons'
import { getAccessToken } from '@/lib/auth/session'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [enrichStatus, setEnrichStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const showMenu = !!model.wordId && !model.isEssential

  const handleEnrich = async () => {
    if (!model.wordId || enrichStatus === 'loading') return
    setEnrichStatus('loading')
    try {
      const accessToken = await getAccessToken()
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: model.wordId,
          text: model.word,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to request enrichment')
      }

      setEnrichStatus('success')
      setMenuOpen(false)
      setTimeout(() => setEnrichStatus('idle'), 3000)
    } catch {
      setEnrichStatus('error')
      setTimeout(() => setEnrichStatus('idle'), 3000)
    }
  }

  const menuMarkup = showMenu ? (
    <>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-3 right-3 text-fg-muted hover:text-fg rounded-lg p-1.5 transition-colors focus-ring cursor-pointer z-10"
        aria-label="Más opciones"
        aria-expanded={menuOpen}
      >
        <MoreVertical size={16} />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-11 z-30 w-48 rounded-lg border border-border-default bg-surface-raised py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100 text-left">
            <button
              type="button"
              onClick={handleEnrich}
              disabled={enrichStatus === 'loading'}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-body-sm text-fg hover:bg-surface-sunken disabled:opacity-50 cursor-pointer"
            >
              {enrichStatus === 'loading' ? (
                <Loader2 size={14} className="animate-spin text-primary shrink-0" />
              ) : (
                <Sparkles size={14} className="text-primary shrink-0" />
              )}
              {enrichStatus === 'loading' ? 'Encolando...' : 'Enriquecer con IA'}
            </button>
          </div>
        </>
      )}
    </>
  ) : null

  const feedbackMarkup = (
    <>
      {enrichStatus === 'success' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 rounded-full bg-success-soft px-3 py-1 text-tiny font-medium text-success border border-[var(--success)]/20 animate-in fade-in slide-in-from-top-1 duration-200">
          Encolado para enriquecer con IA ✨
        </div>
      )}
      {enrichStatus === 'error' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 rounded-full bg-error-soft px-3 py-1 text-tiny font-medium text-error border border-[var(--error)]/20 animate-in fade-in slide-in-from-top-1 duration-200">
          Error al solicitar enriquecimiento ❌
        </div>
      )}
    </>
  )

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
        <div className="relative flex w-full flex-col items-center">
          {menuMarkup}
          {feedbackMarkup}
          {body}
        </div>
      ) : (
        <div className="relative flex w-full max-w-md flex-col items-center gap-[var(--layout-stack)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad sm:gap-[var(--space-5)]">
          {menuMarkup}
          {feedbackMarkup}
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
