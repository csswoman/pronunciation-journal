import { Target } from "@/components/icons"
import type { AccuracyStats } from '@/lib/progress/queries'
import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  stats: AccuracyStats
}

function qualityLabel(accuracy: number): { text: string; className: string; strokeClass: string } {
  if (accuracy >= 85) {
    return { text: 'Excelente', className: 'text-[var(--success)]', strokeClass: 'stroke-[var(--success)]' }
  }
  if (accuracy >= 70) {
    return { text: 'Buena', className: 'text-[var(--primary)]', strokeClass: 'stroke-[var(--primary)]' }
  }
  if (accuracy >= 50) {
    return { text: 'Mejorando', className: 'text-[var(--warning)]', strokeClass: 'stroke-[var(--warning)]' }
  }
  return { text: 'Sigue así', className: 'text-[var(--warning)]', strokeClass: 'stroke-[var(--warning)]' }
}

export function AccuracyTrend({ stats }: Props) {
  const hasData = stats.totalAnswers7 > 0
  const quality = hasData ? qualityLabel(stats.accuracy7) : null

  const radius = 74
  const circumference = Math.PI * radius
  const dash = hasData ? (stats.accuracy7 / 100) * circumference : 0

  return (
    <ProgressCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ProgressCardHeader icon={<Target size={16} />} title="Precisión" />
        <span className="shrink-0 font-kicker text-[11px] font-semibold text-fg-subtle">
          ÚLTIMOS 7 DÍAS
        </span>
      </div>

      <div className="mt-1 flex flex-col items-center">
        <div className="relative w-[180px]">
          <svg
            width="100%"
            height="auto"
            viewBox="0 0 180 100"
            className="block"
            role="img"
            aria-label={hasData ? `Precisión de ${stats.accuracy7}% (${quality?.text})` : "Sin datos de precisión"}
          >
            <path
              d="M16 90 A74 74 0 0 1 164 90"
              fill="none"
              strokeWidth={12}
              strokeLinecap="round"
              className="stroke-surface-sunken"
            />
            {quality ? (
              <path
                d="M16 90 A74 74 0 0 1 164 90"
                fill="none"
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                className={quality.strokeClass}
              />
            ) : null}
          </svg>
          <div className="-mt-[26px] text-center text-h2 leading-none text-fg">
            {hasData ? `${stats.accuracy7}%` : '—'}
          </div>
        </div>

        {quality ? (
          <p className={`mt-0.5 text-body-sm font-semibold ${quality.className}`}>
            {quality.text}
          </p>
        ) : null}

        <p className="mt-2 text-caption text-fg-subtle text-center">
          {hasData
            ? `Basado en ${stats.totalAnswers7.toLocaleString()} respuesta${stats.totalAnswers7 !== 1 ? 's' : ''}`
            : 'Sin respuestas registradas esta semana'}
        </p>
      </div>
    </ProgressCard>
  )
}
