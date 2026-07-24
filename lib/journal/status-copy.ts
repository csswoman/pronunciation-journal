import type { JournalStatus } from '@/lib/journal/types'

/** Shared learner-facing status labels (feminine: la página). */
export const JOURNAL_STATUS_COPY: Record<JournalStatus, string> = {
  draft: 'Borrador',
  submitted: 'Guardada',
  corrected: 'Revisada',
}

export const JOURNAL_STATUS_CLASS: Record<JournalStatus, string> = {
  draft: 'bg-surface-sunken text-fg-muted',
  submitted: 'bg-warning-soft text-warning',
  corrected: 'bg-success-soft text-success',
}
