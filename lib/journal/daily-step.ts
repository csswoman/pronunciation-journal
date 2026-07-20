import type { DailyStep } from '@/lib/practice/types'

/**
 * Cadence for surfacing the optional Journal entry point in Daily. The step is
 * a `concept` link (no evaluated exercises), so it never displaces the minimum
 * practice; it is appended AFTER the daily step cap. Offered every third day so
 * writing stays a gentle habit rather than a daily obligation.
 */
export const JOURNAL_STEP_CADENCE_DAYS = 3

export function shouldOfferJournalStep(dayOfYear: number): boolean {
  return dayOfYear % JOURNAL_STEP_CADENCE_DAYS === 0
}

/**
 * Optional Daily → Journal navigation step. Concept steps with an `href` render
 * as a link and are never auto-completed: Journal has no durable completion
 * signal in Daily, so we do not simulate one (Plan 054 STOP condition).
 */
export function buildJournalDailyStep(): DailyStep {
  return {
    kind: 'concept',
    id: 'journal_entry',
    title: 'Escribe en tu Journal',
    subtitle: 'Redacta unas líneas y recibe corrección',
    icon: 'Pencil',
    exercises: [],
    href: '/journal',
    estMinutes: 5,
  }
}
