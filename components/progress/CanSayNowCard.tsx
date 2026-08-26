// Planned structure:
// <CanSayNowCard>
//   <MasteredList />    — structures owned, with the learner's own sentence
//   <InProgressList />  — structures appearing but not yet consolidated

import type { CanSayNow } from '@/lib/progress/can-say-now'

interface Props {
  data: CanSayNow
}

export function CanSayNowCard({ data }: Props) {
  const hasAny = data.mastered.length > 0 || data.inProgress.length > 0

  return (
    <section
      aria-labelledby="can-say-now-heading"
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5"
    >
      <header className="flex flex-col gap-1">
        <h2 id="can-say-now-heading" className="text-h4 font-semibold text-fg">
          Ahora puedo decir…
        </h2>
        <p className="text-body-sm text-fg-muted">
          Estructuras que has producido tú, sin que te las dieran hechas.
        </p>
      </header>

      {!hasAny && (
        <p className="text-body-sm text-fg-muted">
          Todavía no hay datos. Completa unas cuantas sesiones de habla y aquí verás
          lo que ya puedes producir.
        </p>
      )}

      {data.mastered.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.mastered.map((entry) => (
            <li key={entry.constraintId} className="flex flex-col gap-1">
              <span className="text-body-sm font-medium text-fg">{entry.label}</span>
              {entry.example && (
                <span className="text-body-sm italic text-fg-muted">
                  “{entry.example}”
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.inProgress.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
          <h3 className="text-caption font-medium text-fg-muted">Casi</h3>
          <ul className="flex flex-wrap gap-2">
            {data.inProgress.map((entry) => (
              <li
                key={entry.constraintId}
                className="rounded-full border border-border-subtle px-3 py-1 text-caption text-fg-muted"
              >
                {entry.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
