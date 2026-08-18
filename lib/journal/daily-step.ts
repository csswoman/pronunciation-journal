import type { DailyStep } from '@/lib/practice/types'

/**
 * Journal is a core habit of English Journal. Offered every day as an optional
 * concept link appended AFTER the daily step cap so it never displaces evaluated
 * practice. Home also surfaces a quiet state card for the same destination.
 */
export const JOURNAL_STEP_CADENCE_DAYS = 1

export function shouldOfferJournalStep(dayOfYear: number): boolean {
  return dayOfYear >= 0
}

/**
 * Daily → Journal navigation step. Concept steps with an `href` render as a
 * link and are never auto-completed: Journal has no durable completion signal
 * in Daily, so we do not simulate one (Plan 054 STOP condition).
 */
export function buildJournalDailyStep(): DailyStep {
  return {
    kind: 'concept',
    id: 'journal_entry',
    title: 'Escribe en tu diario',
    subtitle: 'Unas líneas y, si quieres, corrección',
    icon: 'Pencil',
    exercises: [],
    href: '/journal',
    estMinutes: 5,
  }
}
