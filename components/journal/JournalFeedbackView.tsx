'use client'

import { ArrowRight } from '@/components/icons'
import { SuggestedWords } from './SuggestedWords'
import type { JournalFeedback } from '@/lib/journal/correction'

interface JournalFeedbackViewProps {
  correctedContent: string
  feedback: JournalFeedback
}

/** Shows the corrected text, expandable per-error explanations and opt-in words. */
export function JournalFeedbackView({ correctedContent, feedback }: JournalFeedbackViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="journal-corrected" className="flex flex-col gap-2">
        <h2 id="journal-corrected" className="font-h4 font-semibold text-fg">
          Versión corregida
        </h2>
        <p className="whitespace-pre-wrap rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 text-base text-fg">
          {correctedContent}
        </p>
      </section>

      {feedback.errors.length > 0 && (
        <section aria-labelledby="journal-errors" className="flex flex-col gap-2">
          <h3 id="journal-errors" className="font-body-sm font-semibold text-fg">
            {feedback.errors.length === 1
              ? '1 corrección'
              : `${feedback.errors.length} correcciones`}
          </h3>
          <ul className="flex flex-col gap-2">
            {feedback.errors.map((error, index) => (
              <li key={`${error.quote}-${index}`}>
                <details className="group rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised">
                  <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 font-body-sm text-fg">
                    <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-body-xs text-fg-muted">
                      {error.type}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-error line-through">{error.quote}</span>
                      <ArrowRight size={12} className="mx-1 inline text-fg-subtle" aria-hidden />
                      <span className="text-success">{error.correction}</span>
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

      <SuggestedWords words={feedback.newWords} />
    </div>
  )
}
