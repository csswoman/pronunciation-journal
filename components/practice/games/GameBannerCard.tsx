'use client'

// Planned structure:
// <GameBannerCard>
//   <PastelContainer tone={tone}>
//     <BannerLeftContent>
//       <GameIcon />
//       <TextGroup kicker title description />
//     </BannerLeftContent>
//     <BannerStatsChips gamesPlayed bestTime />
//   </PastelContainer>
// </GameBannerCard>

import PastelCard from '@/components/layout/PastelCard'
import { CloudRain, Grid2x2 } from '@/components/icons'
import type { PracticeGame } from '@/lib/practice/practice-games'

interface GameBannerCardProps {
  game: PracticeGame
  gamesPlayedCount?: number
  bestTimeLabel?: string
}

export default function GameBannerCard({
  game,
  gamesPlayedCount = 9,
  bestTimeLabel = 'mejor: 3:12',
}: GameBannerCardProps) {
  const tone = game.tone
  const Icon = game.id === 'word-search' ? Grid2x2 : CloudRain
  const kicker = game.kicker
  const description = game.bannerDescription

  return (
    <PastelCard
      tone={tone}
      className="rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-ink"
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink/10 shadow-[inset_0_0_0_2px_#12151c]">
          <Icon size={28} className="text-ink" aria-hidden="true" />
        </span>

        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/80">
            {kicker}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink leading-tight">
            {game.title}
          </h2>
          <p className="font-sans text-body-sm text-[#4a5263] text-pretty">
            {description}
          </p>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 self-start sm:self-center">
        <span className="inline-flex items-center rounded-full bg-ink/10 px-3.5 py-1 font-sans text-caption font-bold text-ink">
          {gamesPlayedCount} partidas jugadas
        </span>
        <span className="inline-flex items-center rounded-full bg-ink/10 px-3.5 py-1 font-sans text-caption font-bold text-ink">
          {bestTimeLabel}
        </span>
      </div>
    </PastelCard>
  )
}
