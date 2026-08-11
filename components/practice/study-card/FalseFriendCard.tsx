'use client'

// Planned structure:
// <FalseFriendCard>
//   <CardHeader />    — the trap word + level badge
//   <ContrastRow />   — ✗ what it is NOT · ✓ what it means
//   <CorrectionBlock /> — "¿querías decir X? → usa Y"
//   <CardNote />      — optional caveat (partial overlap, social risk)
//   <PracticeActionBar /> — advance to the next card / start practising

import { cn } from '@/lib/cn'
import { Volume2 } from '@/components/icons'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import type { FalseFriendIntro } from '@/lib/practice/study-card/model'

interface Props {
  model: FalseFriendIntro
  onContinue: () => void
  onListen?: (word: string) => void
  /** Label for the advance button; the last card usually reads "Practicar". */
  continueLabel?: string
}

export function FalseFriendCard({ model, onContinue, onListen, continueLabel = 'Practicar' }: Props) {
  const { word, looksLike, actualMeaning, correctWord, levelBadge, note } = model

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad sm:gap-5">
      <div className="flex w-full items-center justify-between gap-3">
        <span className="font-kicker text-accent">Falso amigo</span>
        <div className="flex items-center gap-2">
          {levelBadge && (
            <span className="font-kicker rounded-full border border-border-subtle px-2 py-0.5 text-fg-subtle">
              {levelBadge}
            </span>
          )}
          {onListen && (
            <button
              type="button"
              onClick={() => onListen(word)}
              aria-label={`Escuchar ${word}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default text-fg-subtle transition-colors hover:border-border-strong hover:text-fg-muted cursor-pointer"
            >
              <Volume2 size={14} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <h2 className="m-0 text-display-word font-semibold tracking-tight text-fg">{word}</h2>

      <div className="flex w-full flex-col gap-2">
        <ContrastRow variant="wrong" label="No es" value={looksLike} />
        <ContrastRow variant="right" label="Es" value={actualMeaning} />
      </div>

      <div className="flex w-full flex-col items-center gap-0.5 rounded-md bg-surface-sunken px-4 py-3 text-center">
        <p className="m-0 text-caption text-fg-subtle">
          ¿Querías decir &ldquo;{looksLike}&rdquo;?
        </p>
        <p className="m-0 text-body-md font-semibold text-fg">{correctWord}</p>
      </div>

      {note && (
        <p className="m-0 max-w-[40ch] text-center text-caption leading-relaxed text-fg-muted">
          {note}
        </p>
      )}

      <PracticeActionBar>
        <PracticeContinueButton onClick={onContinue}>{continueLabel}</PracticeContinueButton>
      </PracticeActionBar>
    </div>
  )
}

function ContrastRow({
  variant,
  label,
  value,
}: {
  variant: 'wrong' | 'right'
  label: string
  value: string
}) {
  const isWrong = variant === 'wrong'

  return (
    <div className="flex items-baseline gap-2">
      <span
        aria-hidden
        className={cn('text-body-sm font-semibold', isWrong ? 'text-error' : 'text-success')}
      >
        {isWrong ? '✗' : '✓'}
      </span>
      <span className="font-kicker w-10 shrink-0 text-fg-subtle">{label}</span>
      <span
        className={cn(
          'text-body-md',
          isWrong ? 'text-fg-muted line-through' : 'font-medium text-fg',
        )}
      >
        {value}
      </span>
    </div>
  )
}
