// Structure:
// <CanSayNowCard>
//   <Header />
//   <SpeechLatencyBanner />
//   <MasteredList />
//   <InProgressList />
//   <DailyPracticeLink />
// </CanSayNowCard>

import Link from "next/link"
import type { CanSayNow } from '@/lib/progress/can-say-now'
import type { SpeechLatencyData } from '@/lib/progress/speech-latency-queries'

interface Props {
  data: CanSayNow
  latency?: SpeechLatencyData
}

export function CanSayNowCard({ data, latency }: Props) {
  const hasAny = data.mastered.length > 0 || data.inProgress.length > 0

  return (
    <section
      aria-labelledby="can-say-now-heading"
      className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-raised p-5"
    >
      <header className="flex flex-col gap-1">
        <h2 id="can-say-now-heading" className="text-h4 font-semibold text-fg">
          Ahora puedo decir…
        </h2>
        <p className="text-body-sm text-fg-muted">
          Estructuras que has producido tú, sin que te las dieran hechas.
        </p>
      </header>

      {latency && latency.averageMs !== null && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-surface-sunken px-3 py-2 text-caption">
          <span className="font-medium text-fg">
            ⏱️ Latencia media de habla: {(latency.averageMs / 1000).toFixed(1)}s
          </span>
          {latency.trend && latency.trend.improvedMs > 0 && (
            <span className="font-semibold text-success">
              (↓ {(latency.trend.improvedMs / 1000).toFixed(1)}s más ágil que hace dos semanas)
            </span>
          )}
        </div>
      )}

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

      <Link
        href="/daily"
        className="mt-1 inline-flex min-h-[44px] items-center text-caption font-semibold text-primary transition-opacity hover:opacity-80 focus-ring"
      >
        Practicar producción oral →
      </Link>
    </section>
  )
}
