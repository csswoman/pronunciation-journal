'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getWordStrength } from '@/lib/word-bank/strength'
import { WordStrengthBars } from '@/components/vocabulary/words/WordStrengthBars'
import { useReviewSession } from '@/hooks/useReviewSession'
import { ReviewSessionLauncher } from '@/components/practice/review/ReviewSessionLauncher'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { SoundDueHome } from '@/lib/home/constants'

const WORDS_PREVIEW_LIMIT = 3
const SOUNDS_PREVIEW_LIMIT = 3

interface HomeReviewQueueCardProps {
  words?: WordBankEntry[]
  dueCount?: number
  soundsDue?: SoundDueHome[]
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return ''
  return ipa.startsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
}

export default function HomeReviewQueueCard({
  words = [],
  dueCount = 0,
  soundsDue = [],
}: HomeReviewQueueCardProps) {
  const { state, sessionKey, startReview, advanceStep, exitSession } = useReviewSession()

  const wordPreview = words.slice(0, WORDS_PREVIEW_LIMIT)
  const soundPreview = soundsDue.slice(0, SOUNDS_PREVIEW_LIMIT)
  const atRiskCount = wordPreview.filter((w) => getWordStrength(w) === 'weak').length
  const totalDue = dueCount + soundsDue.length
  const hasPreview = wordPreview.length > 0 || soundPreview.length > 0
  const hasDue = dueCount > 0 || soundsDue.length > 0

  return (
    <>
      <ReviewSessionLauncher
        state={state}
        sessionKey={sessionKey}
        onStepComplete={advanceStep}
        onExit={exitSession}
      />

      <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="type-stat text-2xl">{totalDue}</span>
            <span className="font-body-sm text-[var(--text-secondary)]">
              {totalDue === 1 ? 'item' : 'items'} due
            </span>
          </div>
          {atRiskCount > 0 ? (
            <span className="font-caption flex items-center gap-1.5 text-[var(--warning)]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" aria-hidden />
              {atRiskCount} weakening
            </span>
          ) : null}
        </div>

        {hasDue ? (
          <div className="mt-1 flex gap-3">
            {dueCount > 0 ? (
              <span className="font-caption text-[var(--text-tertiary)]">
                {dueCount} {dueCount === 1 ? 'word' : 'words'}
              </span>
            ) : null}
            {soundsDue.length > 0 ? (
              <span className="font-caption text-[var(--text-tertiary)]">
                {soundsDue.length} {soundsDue.length === 1 ? 'sound' : 'sounds'}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="font-body-sm mt-1 text-[var(--text-tertiary)]">
            Nothing due yet — check back later.
          </p>
        )}

        {hasPreview ? (
          <div className="mt-4 flex flex-col gap-3">
            {wordPreview.map((w) => {
              const ipa = formatIpa(w.ipa)
              return (
                <div key={w.id} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-medium leading-tight text-[var(--text-primary)]">
                      {w.text}
                      {ipa ? (
                        <span className="font-ipa ml-2 text-base font-normal text-[var(--primary)]">
                          {ipa}
                        </span>
                      ) : null}
                    </p>
                    {w.translation ? (
                      <p className="font-body-sm mt-0.5 text-[var(--text-tertiary)]">{w.translation}</p>
                    ) : null}
                  </div>
                  <WordStrengthBars strength={getWordStrength(w)} size={14} />
                </div>
              )
            })}
            {soundPreview.map((s) => (
              <div key={s.soundId} className="min-w-0">
                <p className="font-display text-base font-medium leading-tight text-[var(--text-primary)]">
                  <span className="font-ipa text-[var(--primary)]">{formatIpa(s.ipa)}</span>
                  {s.example ? (
                    <span className="font-body-sm ml-2 font-normal text-[var(--text-secondary)]">
                      {s.example}
                    </span>
                  ) : null}
                </p>
                <p className="font-caption mt-0.5 text-[var(--text-tertiary)]">
                  {s.accuracy}% · {s.daysOverdue > 0 ? `${s.daysOverdue}d overdue` : 'due today'}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {dueCount > WORDS_PREVIEW_LIMIT ? (
          <p className="font-caption mt-3 text-[var(--text-tertiary)]">
            +{dueCount - WORDS_PREVIEW_LIMIT} more in vocabulary
          </p>
        ) : null}

        <Link
          href="/practice/review"
          className="mt-3 font-caption font-medium text-primary transition-opacity hover:opacity-80"
        >
          Ver Review Hub →
        </Link>

        {state.phase === 'done' ? (
          <div className="animate-state-in mt-4 rounded-[var(--radius-md)] bg-[var(--success-soft)] px-4 py-2.5 text-center font-body-sm text-[var(--text-secondary)]">
            Review complete! Come back tomorrow.
          </div>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            icon={state.phase === 'loading' ? undefined : <ArrowRight size={15} />}
            iconPosition="right"
            className="mt-4 justify-center"
            disabled={totalDue === 0 || state.phase === 'loading'}
            onClick={startReview}
          >
            {state.phase === 'loading' ? 'Preparing…' : 'Start review'}
          </Button>
        )}

        {state.phase === 'error' ? (
          <div className="animate-state-in mt-2 flex flex-col items-center gap-2">
            <p className="font-caption text-center text-[var(--error)]">Couldn&apos;t load the review.</p>
            <Button type="button" variant="secondary" size="sm" onClick={startReview}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </>
  )
}
