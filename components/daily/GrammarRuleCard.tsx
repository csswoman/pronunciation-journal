'use client'

// Planned structure:
// <GrammarRuleCard>
//   <RuleHeading />: title + goal
//   <RuleRows />: key/value pairs from the deck's rule block
//   <PracticeActionBar />: single continue action into the exercises
// </GrammarRuleCard>

import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import ConceptFeedbackSelector from '@/components/courses/ConceptFeedbackSelector'
import type { DailyStep } from '@/lib/practice/types'

interface Props {
  rule: NonNullable<DailyStep['grammarRule']>
  onContinue: () => void
}

/** The rule shown before the grammar step's production exercises. */
export function GrammarRuleCard({ rule, onContinue }: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border-subtle bg-surface-raised p-[var(--layout-card-pad)] sm:gap-5">
      <div className="flex w-full flex-col items-center gap-1 text-center">
        <span className="font-kicker text-accent">Regla</span>
        <h2 className="m-0 text-h4 font-semibold text-fg">{rule.title}</h2>
        {rule.goal && <p className="m-0 text-body-sm text-fg-muted">{rule.goal}</p>}
      </div>

      <dl className="m-0 flex w-full flex-col gap-2">
        {rule.rows.map((row) => (
          <div
            key={row.key}
            className="flex items-baseline gap-2 rounded-md bg-surface-sunken px-4 py-3"
          >
            <dt className="font-kicker w-16 shrink-0 text-fg-subtle">{row.key}</dt>
            <dd className="m-0 text-body-md text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>

      <ConceptFeedbackSelector
        lessonSlug={rule.deckSlug}
        title={rule.title}
        className="w-full"
        compact
      />

      <PracticeActionBar>
        <PracticeContinueButton onClick={onContinue}>Practicar</PracticeContinueButton>
      </PracticeActionBar>
    </div>
  )
}
