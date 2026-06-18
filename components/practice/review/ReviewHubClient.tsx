'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { WordStrengthBars } from '@/components/vocabulary/words/WordStrengthBars'
import { getWordStrength } from '@/lib/word-bank/strength'
import { useReviewSession } from '@/hooks/useReviewSession'
import { ReviewSessionLauncher } from '@/components/practice/review/ReviewSessionLauncher'
import { ReviewSectionCard } from '@/components/practice/review/ReviewSectionCard'
import { SrsHistoryPanel } from '@/components/practice/review/SrsHistoryPanel'
import type { ReviewHubSummary } from '@/lib/review/types'

interface Props {
  summary: ReviewHubSummary
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return ''
  return ipa.startsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
}

export function ReviewHubClient({ summary }: Props) {
  const { state, sessionKey, startReview, startFailedItem, advanceStep, exitSession } =
    useReviewSession()
  const { counts } = summary
  const canStart = summary.canStartReview && state.phase !== 'loading'

  return (
    <>
      <ReviewSessionLauncher
        state={state}
        sessionKey={sessionKey}
        onStepComplete={advanceStep}
        onExit={exitSession}
      />

      <div className="flex flex-col gap-4">
        <ReviewSectionCard
          title="Failed sentences"
          count={counts.failedSentences}
          emptyMessage="No recent errors in dictations or sentences."
        >
          <ul className="flex flex-col gap-2">
            {summary.failedSentences.slice(0, 4).map((item) => (
              <li
                key={item.contentId}
                className="flex items-start justify-between gap-3 font-body-sm text-fg-secondary"
              >
                <div className="min-w-0">
                  <span className="text-fg">{item.label}</span>
                  <span className="ml-2 font-caption text-fg-muted">{item.typeLabel}</span>
                  {!item.drillable ? (
                    <span className="ml-2 font-caption text-fg-subtle">· history only</span>
                  ) : null}
                </div>
                {item.drillable && state.phase !== 'loading' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-primary"
                    onClick={() => startFailedItem(item)}
                  >
                    Practice
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Weak words"
          count={counts.weakWords}
          emptyMessage="No words in learning — great job."
        >
          <ul className="flex flex-col gap-3">
            {summary.weakWords.slice(0, 4).map((w) => (
              <li key={w.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-medium text-fg">{w.text}</p>
                  {w.translation ? (
                    <p className="font-body-sm text-fg-muted">{w.translation}</p>
                  ) : null}
                </div>
                <WordStrengthBars strength={getWordStrength(w)} size={14} />
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Vocabulary due"
          count={counts.dueWords}
          emptyMessage="No words due today."
        >
          <ul className="flex flex-col gap-2">
            {summary.dueWords.slice(0, 4).map((w) => (
              <li key={w.id} className="font-body-sm text-fg">
                {w.text}
                {w.ipa ? (
                  <span className="font-ipa ml-2 text-primary">{formatIpa(w.ipa)}</span>
                ) : null}
              </li>
            ))}
          </ul>
          {counts.dueWords > 0 ? (
            <Link href="/words" className="font-caption text-primary hover:opacity-80">
              View lexicon →
            </Link>
          ) : null}
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Sounds due"
          count={counts.soundsDue}
          emptyMessage="No phoneme contrasts due today."
        >
          <ul className="flex flex-col gap-2">
            {summary.soundsDue.slice(0, 4).map((s) => (
              <li key={`${s.soundId}-${s.ipa}`} className="font-body-sm text-fg">
                <span className="font-ipa text-primary">{formatIpa(s.ipa)}</span>
                {s.example ? (
                  <span className="ml-2 text-fg-secondary">{s.example}</span>
                ) : null}
                <span className="ml-2 font-caption text-fg-muted">
                  {s.daysOverdue > 0 ? `${s.daysOverdue}d overdue` : 'due today'}
                </span>
              </li>
            ))}
          </ul>
          {counts.soundsDue > 0 ? (
            <Link href="/practice/sounds" className="font-caption text-primary hover:opacity-80">
              Sound Lab →
            </Link>
          ) : null}
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Concepts due"
          count={counts.dueTopics}
          emptyMessage="No grammar concepts due today."
        >
          <ul className="flex flex-col gap-2">
            {summary.dueTopics.slice(0, 4).map((t) => (
              <li key={t.id} className="font-body-sm text-fg">
                {t.topic}
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Weak concepts"
          count={counts.weakTopics}
          emptyMessage="No concepts in learning."
        >
          <ul className="flex flex-col gap-2">
            {summary.weakTopics.slice(0, 4).map((t) => (
              <li key={t.id} className="font-body-sm text-fg">
                {t.topic}
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <SrsHistoryPanel groups={summary.srsHistory} />

        {state.phase === 'done' ? (
          <div className="rounded-[var(--radius-md)] bg-[var(--success-soft)] px-4 py-3 text-center font-body-sm text-fg-secondary">
            Review complete. Come back tomorrow or keep practicing in your daily plan.
          </div>
        ) : state.phase === 'loading' ? (
          <Button type="button" variant="primary" size="md" fullWidth disabled>
            Loading…
          </Button>
        ) : canStart ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            icon={<ArrowRight size={15} />}
            iconPosition="right"
            onClick={startReview}
          >
            Start full review
          </Button>
        ) : state.phase === 'idle' ? (
          <Link
            href="/daily"
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3',
              'text-sm font-semibold transition-all duration-150 ease-out-quart focus-ring',
              'bg-[var(--cta-bg)] text-[var(--cta-fg)] hover:bg-[var(--cta-bg-hover)]',
            )}
          >
            Go practice
            <ArrowRight size={15} aria-hidden />
          </Link>
        ) : null}

        {state.phase === 'error' ? (
          <p className="font-caption text-center text-error">Could not load review session.</p>
        ) : null}

        {!summary.canStartReview && state.phase === 'idle' ? (
          <p className="font-body-sm text-center text-fg-muted">
            {counts.failedSentences > 0 && counts.reviewable === 0
              ? 'You have recent errors in your history, but nothing ready to review today. Keep going with your daily plan.'
              : 'Nothing pending right now. Practice in your daily plan to generate new items.'}
          </p>
        ) : null}
      </div>
    </>
  )
}
