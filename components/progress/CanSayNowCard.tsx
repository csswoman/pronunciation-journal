// Structure:
// <CanSayNowCard>
//   <Header />
//   <SpeechLatencyBanner />
//   <MasteredList />
//   <InProgressList />
//   <DailyPracticeLink />
// </CanSayNowCard>

import Link from "next/link"
import { Timer, Check } from "@/components/icons"
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
      className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 sm:p-5"
    >
      <header className="flex flex-col gap-0.5">
        <span className="font-kicker font-semibold text-fg-subtle">Producción oral</span>
        <h2 id="can-say-now-heading" className="text-h4 font-semibold text-fg">
          Ahora puedo decir…
        </h2>
        <p className="text-body-sm text-fg-muted">
          Estructuras que has formulado tú mismo de forma espontánea en tus sesiones orales.
        </p>
      </header>

      {latency && latency.averageMs !== null && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3.5 py-2.5 text-caption">
          <div className="flex items-center gap-1.5 font-medium text-fg">
            <Timer size={15} className="shrink-0 text-primary" aria-hidden="true" />
            <span>Tiempo medio de respuesta oral: {(latency.averageMs / 1000).toFixed(1)}s</span>
          </div>
          {latency.trend && latency.trend.improvedMs > 0 && (
            <span className="font-semibold text-success">
              (↓ {(latency.trend.improvedMs / 1000).toFixed(1)}s más ágil que hace dos semanas)
            </span>
          )}
        </div>
      )}

      {!hasAny && (
        <p className="py-2 text-body-sm text-fg-muted">
          Aún no registras producción oral espontánea. Completa sesiones diarias de habla
          y aquí aparecerán las estructuras que logras producir con fluidez.
        </p>
      )}

      {data.mastered.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {data.mastered.map((entry) => (
            <li
              key={entry.constraintId}
              className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken/40 p-3"
            >
              <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-soft text-success mt-0.5">
                <Check size={12} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-body-sm font-semibold text-fg">{entry.label}</span>
                {entry.example && (
                  <span className="text-caption italic text-fg-muted">
                    “{entry.example}”
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.inProgress.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
          <h3 className="font-kicker font-semibold text-fg-subtle">En aprendizaje</h3>
          <ul className="flex flex-wrap gap-2">
            {data.inProgress.map((entry) => (
              <li
                key={entry.constraintId}
                className="rounded-full border border-border-subtle bg-surface-sunken px-3 py-1 text-caption font-medium text-fg-muted"
              >
                {entry.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/daily"
        className="mt-1 inline-flex min-h-[44px] items-center text-body-sm font-semibold text-primary transition-opacity hover:opacity-80 focus-ring"
      >
        Practicar producción oral →
      </Link>
    </section>
  )
}
