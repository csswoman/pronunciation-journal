'use client'

import type { JournalNudge } from '@/lib/journal/nudge'

export function JournalNudgePanel({
  calls,
  nudges,
  requesting,
  errorMessage,
  onRequest,
}: {
  calls: number
  nudges: JournalNudge[]
  requesting: boolean
  errorMessage: string | null
  onRequest: () => void
}) {
  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <button
        type="button"
        className="focus-ring min-h-11 w-full rounded-[var(--radius-sm)] border border-border-default px-3 text-left font-body-sm font-medium text-fg"
        onClick={onRequest}
        disabled={requesting || calls >= 3}
      >
        {calls >= 3 ? 'Ya tienes por dónde seguir' : requesting ? 'Buscando una pista…' : 'Estoy atascada'}
      </button>
      {nudges.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2" aria-label="Pistas para continuar">
          {nudges.map((nudge, index) => (
            <li key={`${nudge.en}-${index}`} className="rounded-[var(--radius-sm)] bg-surface-sunken px-3 py-2.5">
              <p className="font-body-sm text-fg">{nudge.en}</p>
              <p className="mt-1 font-body-xs text-fg-muted">{nudge.es}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="mt-3 font-body-sm text-error">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
