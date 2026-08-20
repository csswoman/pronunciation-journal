'use client'

import { ArrowRight, ChevronDown } from '@/components/icons'
import { SuggestedWords } from './SuggestedWords'
import { journalErrorTypeLabel } from '@/lib/journal/error-type-label'
import type { JournalFeedback } from '@/lib/journal/correction'
import { JOURNAL_TOPIC_CATALOG } from '@/lib/journal/topic-catalog'

interface JournalFeedbackViewProps {
  originalContent: string
  correctedContent: string
  feedback: JournalFeedback
  /** Kept optional for callers that still pass the authenticated id; topics are now auto-scheduled server-side. */
  userId?: string
  showReactive?: boolean
}

/** Shows the revised text, soft per-change notes, and opt-in words. */
export function JournalFeedbackView({
  originalContent,
  correctedContent,
  feedback,
  showReactive = true,
}: JournalFeedbackViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <section
        aria-labelledby="journal-corrected"
        className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-base p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 id="journal-corrected" className="font-h4 font-semibold text-fg">
            Una versión más natural
          </h2>
          <span className="rounded-full bg-success-soft px-2.5 py-0.5 font-body-xs font-semibold text-success">
            Revisión completada
          </span>
        </div>
        <p className="whitespace-pre-wrap font-body text-base leading-relaxed text-fg">
          {correctedContent}
        </p>
      </section>

      {originalContent.trim().length > 0 && (
        <details className="group rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken">
          <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 font-body-sm font-medium text-fg">
            <ChevronDown
              size={14}
              className="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
              aria-hidden
            />
            Ver tu texto original
          </summary>
          <p className="whitespace-pre-wrap border-t border-border-subtle px-3 py-2.5 font-body-sm text-fg-muted">
            {originalContent}
          </p>
        </details>
      )}

      {showReactive ? <JournalReactiveSummary feedback={feedback} /> : null}

      {feedback.errors.length > 0 && (
        <section aria-labelledby="journal-errors" className="flex flex-col gap-2">
          <h3 id="journal-errors" className="font-body-sm font-semibold text-fg">
            {feedback.errors.length === 1
              ? '1 detalle para notar'
              : `${feedback.errors.length} detalles para notar`}
          </h3>
          <ul className="flex flex-col gap-2">
            {feedback.errors.map((error, index) => (
              <li key={`${error.quote}-${index}`}>
                <details className="group rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised transition-colors">
                  <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 font-body-sm text-fg">
                    <ChevronDown
                      size={14}
                      className="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
                      aria-hidden
                    />
                    <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-body-xs font-medium text-primary">
                      {journalErrorTypeLabel(error.type)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-fg-muted">{error.quote}</span>
                      <ArrowRight size={12} className="mx-1 inline text-fg-subtle" aria-hidden />
                      <span className="font-medium text-fg">{error.correction}</span>
                    </span>
                  </summary>
                  <p className="border-t border-border-subtle px-3 py-2.5 font-body-sm text-fg-muted">
                    {error.explanationEs}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function JournalReactiveSummary({ feedback }: { feedback: JournalFeedback }) {
  const hasScheduledTopics = (feedback.scheduledTopics?.length ?? 0) > 0
  const hasSuggestedWords = feedback.newWords.length > 0
  if (!hasScheduledTopics && !hasSuggestedWords) return null

  return (
    <section aria-labelledby="journal-reactive-summary" className="flex flex-col gap-3">
      <h3 id="journal-reactive-summary" className="font-body-sm font-semibold text-fg">
        Después de la revisión
      </h3>
      {hasScheduledTopics ? (
        <section aria-labelledby="journal-scheduled-topics" className="flex flex-col gap-2">
          <h4 id="journal-scheduled-topics" className="font-body-sm font-semibold text-fg">
            Reglas programadas
          </h4>
          <ul className="flex flex-col gap-2">
            {feedback.scheduledTopics?.map((topic) => (
              <li
                key={topic.topicId}
                className="flex items-baseline justify-between gap-3 rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2.5 font-body-sm"
              >
                <span className="min-w-0 text-fg">{topicLabel(topic.topicId)}</span>
                <span className="shrink-0 text-fg-muted">{reviewCopy(topic)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {hasSuggestedWords ? <SuggestedWords words={feedback.newWords} /> : null}
    </section>
  )
}

function topicLabel(topicId: string): string {
  return JOURNAL_TOPIC_CATALOG.find((topic) => topic.id === topicId)?.label ?? topicId
}

function reviewCopy(topic: { nextReviewAt: string; intervalDays: number }): string {
  if (topic.intervalDays === 1) return 'vuelve mañana'
  if (topic.intervalDays < 7) return `vuelve en ${topic.intervalDays} días`
  return `vuelve el ${new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long' }).format(new Date(topic.nextReviewAt))}`
}
