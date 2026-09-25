// Planned structure:
// <ReviewHeroCard>
//   <ReviewHeroBadgeRow />
//   <ReviewHeroMetrics />
//   <ReviewHeroProgressBar />
//   <ReviewHeroActions />
// </ReviewHeroCard>

import Button from '@/components/ui/Button'
import PastelCard from '@/components/layout/PastelCard'

interface ReviewHeroCardProps {
  totalCount: number
  estimatedMinutes?: number
  vocabCount: number
  weakWordsCount: number
  soundsCount: number
  sentencesCount: number
  overdueOneWeekCount?: number
  onStartReview: () => void
  onStartShortReview?: () => void
  isSessionActive?: boolean
}

export function ReviewHeroCard({
  totalCount,
  estimatedMinutes = 12,
  vocabCount,
  weakWordsCount,
  soundsCount,
  sentencesCount,
  overdueOneWeekCount = 6,
  onStartReview,
  onStartShortReview,
  isSessionActive = false,
}: ReviewHeroCardProps) {
  // Compute category proportions for the stacked bar
  const sumCategories = Math.max(1, vocabCount + weakWordsCount + soundsCount + sentencesCount)
  const vocabPct = (vocabCount / sumCategories) * 100
  const weakPct = (weakWordsCount / sumCategories) * 100
  const soundsPct = (soundsCount / sumCategories) * 100
  const sentencesPct = (sentencesCount / sumCategories) * 100

  // Count active sources
  const sourcesCount = [vocabCount, weakWordsCount, soundsCount, sentencesCount].filter(
    (c) => c > 0,
  ).length
  const sourcesLabel =
    sourcesCount === 1
      ? 'de una fuente'
      : sourcesCount === 2
        ? 'de dos fuentes distintas'
        : sourcesCount === 3
          ? 'de tres fuentes distintas'
          : sourcesCount === 4
            ? 'de cuatro fuentes distintas'
            : 'de cinco fuentes distintas'

  return (
    <PastelCard tone="coral" className="relative flex flex-col justify-between p-6 sm:p-8 gap-6 shadow-sm border border-black/10">
      {/* Header tags */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-[#12151c] px-3.5 py-1 text-xs font-black text-white uppercase tracking-wider shadow-2xs">
            HOY
          </span>
          <span className="rounded-full bg-white/80 backdrop-blur-xs border border-[#12151c]/15 px-4 py-1 text-xs sm:text-sm font-bold text-[#12151c]">
            {estimatedMinutes} min aprox.
          </span>
        </div>
        {overdueOneWeekCount > 0 ? (
          <span className="text-xs sm:text-sm font-bold text-[#12151c]/80">
            {overdueOneWeekCount} llevan más de una semana esperando
          </span>
        ) : null}
      </div>

      {/* Main Big Metric */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-black tracking-tight text-[#12151c] sm:text-7xl">
            {totalCount}
          </span>
          <span className="text-3xl font-extrabold text-[#12151c]">pendientes</span>
        </div>
        <p className="text-sm sm:text-base font-bold text-[#12151c]/75">{sourcesLabel}</p>
      </div>

      {/* Stacked Progress Bar & Legend with distinct domain colors */}
      <div className="space-y-3">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#12151c]/15">
          <div
            className="bg-[#12151c] transition-all duration-300"
            style={{ width: `${vocabPct}%` }}
            title={`Vocabulario ${vocabCount}`}
          />
          <div
            className="bg-[#b45309] transition-all duration-300"
            style={{ width: `${weakPct}%` }}
            title={`Palabras débiles ${weakWordsCount}`}
          />
          <div
            className="bg-[#7c3aed] transition-all duration-300"
            style={{ width: `${soundsPct}%` }}
            title={`Sonidos ${soundsCount}`}
          />
          <div
            className="bg-[#059669] transition-all duration-300"
            style={{ width: `${sentencesPct}%` }}
            title={`Frases ${sentencesCount}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-bold text-[#12151c]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#12151c]" />
            Vocabulario {vocabCount}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#b45309]" />
            Palabras débiles {weakWordsCount}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#7c3aed]" />
            Sonidos {soundsCount}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#059669]" />
            Frases {sentencesCount}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3.5 pt-1">
        <Button
          type="button"
          disabled={isSessionActive || totalCount === 0}
          onClick={onStartReview}
          className="rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm sm:text-base px-6 py-3 shadow-md border-none"
        >
          Repasar los {totalCount} · {estimatedMinutes} min →
        </Button>
        <button
          type="button"
          disabled={isSessionActive || totalCount === 0}
          onClick={onStartShortReview || onStartReview}
          className="rounded-full border border-[#12151c]/35 bg-white/60 hover:bg-white/90 text-[#12151c] font-bold text-xs sm:text-sm px-5 py-2.5 transition-colors shadow-2xs"
        >
          Solo 10 · 4 min
        </button>
        <span className="text-xs sm:text-sm font-semibold text-[#12151c]/75 sm:ml-auto">
          Puedes parar cuando quieras: se guarda el avance.
        </span>
      </div>
    </PastelCard>
  )
}
