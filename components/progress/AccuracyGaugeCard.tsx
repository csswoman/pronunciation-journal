// Planned structure:
// <AccuracyGaugeCard>
//   <PastelCard tone="butter">
//     <Header kicker="PRECISIÓN" timeframe="7 días" />
//     <GaugeSemiCircle percentage={stats.accuracy7} status={tierText} />
//     <FooterSummary totalAnswers={stats.totalAnswers7} />
//   </PastelCard>
// </AccuracyGaugeCard>

import PastelCard from "@/components/layout/PastelCard";
import { Sparkles } from "@/components/icons";
import type { AccuracyStats } from "@/lib/progress/queries";

interface Props {
  stats: AccuracyStats;
}

function getAccuracyStatus(accuracy: number): string {
  if (accuracy >= 80) return "Excelente";
  if (accuracy >= 65) return "Mejorando";
  if (accuracy >= 50) return "En desarrollo";
  return "Por afianzar";
}

export function AccuracyGaugeCard({ stats }: Props) {
  const hasData = stats.totalAnswers7 > 0;

  const radius = 82;
  const strokeWidth = 15;
  const circumference = Math.PI * radius;

  if (!hasData) {
    return (
      <PastelCard tone="butter" className="p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
            PRECISIÓN
          </span>
          <span className="inline-flex items-center rounded-full bg-ink/10 px-3 py-0.5 text-xs sm:text-sm font-bold text-ink">
            7 días
          </span>
        </div>
        <p className="my-6 text-center text-sm font-medium text-ink-secondary">
          Responde algunos ejercicios para ver tu precisión aquí.
        </p>
      </PastelCard>
    );
  }

  const accuracy = stats.accuracy7;
  const status = getAccuracyStatus(accuracy);
  const totalAnswers = stats.totalAnswers7;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  return (
    <PastelCard tone="butter" className="p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
          PRECISIÓN
        </span>
        <span className="inline-flex items-center rounded-full bg-ink/10 px-3 py-0.5 text-xs sm:text-sm font-bold text-ink">
          7 días
        </span>
      </div>

      {/* Gauge Semi-Circle with nested value */}
      <div className="my-2 flex flex-col items-center justify-center">
        <div className="relative flex w-[210px] h-[115px] items-end justify-center">
          <svg
            viewBox="0 0 210 115"
            className="w-full h-full overflow-visible"
            role="img"
            aria-label={`Precisión de ${accuracy}%: ${status}`}
          >
            {/* Background Arc */}
            <path
              d="M 23 105 A 82 82 0 0 1 187 105"
              fill="none"
              stroke="var(--ink)"
              strokeOpacity={0.18}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d="M 23 105 A 82 82 0 0 1 187 105"
              fill="none"
              stroke="var(--ink)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Centered Value inside the arc hollow */}
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-tight tracking-tight">
              {accuracy}%
            </span>
            <span className="text-sm sm:text-base font-bold text-ink-secondary mt-0.5">
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Retrieval quality (SRS grade average), when there are graded answers */}
      {stats.retrievalQuality7 != null && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-white/60 px-3 py-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-ink-secondary font-medium">
            <Sparkles size={14} className="shrink-0 text-ink" aria-hidden="true" />
            <span>Calidad de recuerdo</span>
          </div>
          <span className="font-display font-bold text-ink tabular-nums">
            {stats.retrievalQuality7.toFixed(1)} <span className="font-normal text-ink-secondary">/ 5</span>
          </span>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs sm:text-sm text-ink-secondary text-center font-medium">
        Sobre {totalAnswers} respuestas evaluadas
      </p>
    </PastelCard>
  );
}
