'use client'

interface MissionGoalSummaryProps {
  goalAchieved: boolean
}

/** Structured mission outcome; never gated by pronunciation-feedback copy. */
export function MissionGoalSummary({ goalAchieved }: MissionGoalSummaryProps) {
  return (
    <section aria-live="polite" className="rounded-md border border-border-subtle bg-surface-raised px-4 py-3">
      <p className="m-0 font-kicker text-fg-subtle">RESULTADO</p>
      <p className="mb-0 mt-1 text-label font-semibold text-fg">
        {goalAchieved ? 'Objetivo logrado' : 'Objetivo pendiente'}
      </p>
    </section>
  )
}
