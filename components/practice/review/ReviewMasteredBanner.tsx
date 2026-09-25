// Planned structure:
// <ReviewMasteredBanner>
//   <MasteredBannerLeftMetric />
//   <MasteredBannerCenterStackedBar />
//   <MasteredBannerRightAction />
// </ReviewMasteredBanner>

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'

interface ReviewMasteredBannerProps {
  masteredCount: number
  newCount: number
  learningCount: number
  reviewCount: number
}

export function ReviewMasteredBanner({
  masteredCount,
  newCount,
  learningCount,
  reviewCount,
}: ReviewMasteredBannerProps) {
  const total = Math.max(1, newCount + learningCount + reviewCount + masteredCount)
  const newPct = (newCount / total) * 100
  const learningPct = (learningCount / total) * 100
  const reviewPct = (reviewCount / total) * 100
  const masteredPct = (masteredCount / total) * 100

  return (
    <PastelCard tone="mint" className="p-6 sm:p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm border border-black/10">
      {/* Left metric */}
      <div className="space-y-1 min-w-[210px]">
        <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#12151c]/75">
          LO QUE YA SABES
        </h5>
        <div className="flex items-baseline gap-2.5">
          <span className="text-5xl sm:text-6xl font-black text-[#12151c]">{masteredCount}</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#12151c]">afianzadas</span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-[#12151c]/75">superaron cinco repasos seguidos</p>
      </div>

      {/* Middle stacked progress bar */}
      <div className="flex-1 space-y-3 max-w-xl">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#12151c]/15">
          <div
            className="bg-[#efd06a] transition-all duration-300"
            style={{ width: `${newPct}%` }}
            title={`Nuevas ${newCount}`}
          />
          <div
            className="bg-[#9ec0f6] transition-all duration-300"
            style={{ width: `${learningPct}%` }}
            title={`Aprendiendo ${learningCount}`}
          />
          <div
            className="bg-[#ee9f8b] transition-all duration-300"
            style={{ width: `${reviewPct}%` }}
            title={`En repaso ${reviewCount}`}
          />
          <div
            className="bg-[#12151c] transition-all duration-300"
            style={{ width: `${masteredPct}%` }}
            title={`Afianzadas ${masteredCount}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-xs sm:text-sm font-extrabold text-[#12151c]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#efd06a]" />
            Nuevas {newCount}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#9ec0f6]" />
            Aprendiendo {learningCount}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ee9f8b]" />
            En repaso {reviewCount}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#12151c]" />
            Afianzadas {masteredCount}
          </span>
        </div>
      </div>

      {/* Right side info & action */}
      <div className="flex flex-col items-start md:items-end justify-between gap-3 min-w-[210px]">
        <p className="text-xs sm:text-sm font-bold text-[#12151c]/75 text-left md:text-right leading-relaxed">
          Las afianzadas vuelven en 2 semanas o más.
        </p>
        <Link
          href="/words"
          className="rounded-full border border-[#12151c]/35 bg-white/70 hover:bg-white/95 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#12151c] transition-colors shadow-2xs"
        >
          Ver las {masteredCount}
        </Link>
      </div>
    </PastelCard>
  )
}
