'use client'

import { Check } from '@/components/icons'
import type { ForecastDay } from '@/lib/essential-words/ready-forecast'
import PastelCard from '@/components/layout/PastelCard'

interface Props {
  streak: number
  marks: boolean[]
  forecast?: ForecastDay[]
}
const SPANISH_DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const

export function SessionReadyStreak({ streak, marks, forecast }: Props) {
  const daysCount = 7
  const now = new Date()

  // In buildStreakMarks, the array represents 7 days ending today (index 6 = today)
  const todayActive = marks.length >= 7 ? Boolean(marks[6]) : Boolean(marks[0])
  const isTodayCompleted = streak > 0 || todayActive

  return (
    <PastelCard
      tone="mint"
      className="p-6 flex flex-col gap-4 shadow-sm animate-home-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-ink-secondary uppercase">
          Racha
        </span>
        <span className="text-2xl font-black text-ink tracking-tight">
          {streak} {streak === 1 ? 'día' : 'días'}
        </span>
      </div>

      {/* Days row: Today + next 6 days */}
      <div
        className="grid grid-cols-7 gap-1.5 sm:gap-2 items-center text-center my-1"
        role="img"
        aria-label={`Racha de ${streak} días`}
      >
        {Array.from({ length: daysCount }).map((_, i) => {
          const isToday = i === 0
          const completed = isToday && isTodayCompleted
          const dueCount = forecast?.[i]?.count ?? 0

          let label = forecast?.[i]?.label
          if (!label) {
            const targetDate = new Date(now)
            targetDate.setDate(now.getDate() + i)
            label = SPANISH_DAY_LETTERS[targetDate.getDay()]
          }

          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`size-9 sm:size-10 rounded-full flex items-center justify-center transition-all ${
                  completed
                    ? 'bg-ink text-paper shadow-xs font-bold text-xs'
                    : dueCount > 0
                      ? 'border-2 border-dashed border-ink/80 text-ink font-black text-sm bg-transparent'
                      : 'border-2 border-dashed border-ink/30 text-transparent bg-transparent text-xs'
                }`}
              >
                {completed ? (
                  <Check size={18} className="stroke-[3]" aria-hidden />
                ) : dueCount > 0 ? (
                  dueCount
                ) : null}
              </div>
              <span className="text-xs sm:text-sm font-bold text-ink-secondary uppercase">
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Subtext */}
      <p className="text-xs sm:text-sm text-ink-secondary mt-2 font-medium">
        Los números son los repasos que te esperan cada día.
      </p>
    </PastelCard>
  )
}
