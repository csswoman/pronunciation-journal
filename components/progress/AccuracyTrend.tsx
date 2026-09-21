// Planned structure:
// <AccuracyTrend>
//   <ProgressCardHeader title="Precisión" />
//   <AccuracyGaugeChart percentage={stats.accuracy7} tier={tier} />
//   <AccuracyTierBadge tier={tier} />
//   <RetrievalQualityMetric quality={stats.retrievalQuality7} />
//   <EvaluatedAnswersCount count={stats.totalAnswers7} />
// </AccuracyTrend>

import { Target, Sparkles } from "@/components/icons"
import type { AccuracyStats } from '@/lib/progress/queries'
import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  stats: AccuracyStats
}

interface AccuracyTier {
  text: string
  className: string
  strokeClass: string
}

function accuracyTierLabel(accuracy: number): AccuracyTier {
  if (accuracy >= 85) {
    return { text: 'Alta precisión', className: 'text-success', strokeClass: 'stroke-success' }
  }
  if (accuracy >= 70) {
    return { text: 'Buena precisión', className: 'text-primary', strokeClass: 'stroke-primary' }
  }
  if (accuracy >= 50) {
    return { text: 'En desarrollo', className: 'text-warning', strokeClass: 'stroke-warning' }
  }
  return { text: 'Por afianzar', className: 'text-warning', strokeClass: 'stroke-warning' }
}

export function AccuracyTrend({ stats }: Props) {
  const hasData = stats.totalAnswers7 > 0
  const tier = hasData ? accuracyTierLabel(stats.accuracy7) : null

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
        <div className="relative flex w-[180px] flex-col items-center">
          <svg
            width="180"
            height="100"
            viewBox="0 0 180 100"
            className="block"
            role="img"
            aria-label={hasData ? `Precisión de ${stats.accuracy7}% (${tier?.text})` : "Sin datos de precisión"}
          >
            <path
              d="M16 90 A74 74 0 0 1 164 90"
              fill="none"
              strokeWidth={12}
              strokeLinecap="round"
              className="stroke-surface-sunken"
            />
            {tier ? (
              <path
                d="M16 90 A74 74 0 0 1 164 90"
                fill="none"
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                className={tier.strokeClass}
              />
            ) : null}
          </svg>
          <div className="absolute bottom-1 left-0 right-0 text-center text-h2 leading-none text-fg">
            {hasData ? `${stats.accuracy7}%` : 'S/D'}
          </div>
        </div>

        {tier ? (
          <p className={`mt-2 text-body-sm font-semibold ${tier.className}`}>
            {tier.text}
          </p>
        ) : null}

        {stats.retrievalQuality7 != null ? (
          <div className="mt-3 flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken px-3 py-2 text-caption">
            <div className="flex items-center gap-1.5 text-left">
              <Sparkles size={14} className="text-primary shrink-0" aria-hidden="true" />
              <div>
                <span className="block font-semibold text-fg">Calidad de recuerdo</span>
                <span className="block text-tiny text-fg-subtle">Escala SRS (1 a 5)</span>
              </div>
            </div>
            <span className="text-body-sm font-bold tabular-nums text-primary">
              {stats.retrievalQuality7.toFixed(1)} <span className="text-tiny font-normal text-fg-muted">/ 5</span>
            </span>
          </div>
        ) : null}

        <p className="mt-2 text-caption text-fg-subtle text-center">
          {hasData
            ? `Basado en ${stats.totalAnswers7.toLocaleString()} respuesta${stats.totalAnswers7 !== 1 ? 's evaluadas' : ' evaluada'}`
            : 'Sin respuestas evaluadas esta semana'}
        </p>
      </div>
    </ProgressCard>
  )
}
