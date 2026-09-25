// Planned structure:
// <ReviewForecastCard>
//   <ReviewForecastHeader />
//   <ReviewForecastChart />
//   <ReviewForecastLegend />
//   <ReviewForecastInsightBox />
// </ReviewForecastCard>

interface DayForecast {
  dayLabel: string
  count: number
  isToday: boolean
}

interface ReviewForecastCardProps {
  todayCount: number
  forecastDays?: DayForecast[]
}

const SPANISH_DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

/** Builds real day labels starting today, using the actual weekday — no invented data. */
function buildDaysFromToday(todayCount: number): DayForecast[] {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    return {
      dayLabel: i === 0 ? 'HOY' : SPANISH_DAY_LABELS[date.getDay()],
      count: i === 0 ? todayCount : 0,
      isToday: i === 0,
    }
  })
}

export function ReviewForecastCard({
  todayCount,
  forecastDays,
}: ReviewForecastCardProps) {
  // Real counts come from the caller (queried per-day); without them, only
  // today's real count is shown and the rest of the week reads as empty
  // rather than inventing a shape.
  const days = forecastDays ?? buildDaysFromToday(todayCount)

  // Take strictly 7 days
  const sevenDays = days.slice(0, 7)
  const maxCount = Math.max(1, ...sevenDays.map((d) => d.count))

  const upcomingDays = sevenDays.filter((d) => !d.isToday)
  const maxUpcoming = upcomingDays.length > 0 ? Math.max(...upcomingDays.map((d) => d.count)) : 0
  const peakDay = maxUpcoming > 0 ? upcomingDays.find((d) => d.count === maxUpcoming) ?? null : null
  const peakReduced = peakDay ? Math.max(0, peakDay.count - todayCount) : 0

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-xs gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-text-strong">
          CUÁNDO VUELVE CADA COSA
        </h3>
        <span className="rounded-full bg-field border border-border-subtle px-3.5 py-1 text-xs sm:text-sm font-bold text-text-muted">
          próximos 7 días
        </span>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="flex items-end justify-between gap-2.5 pt-4 pb-2 px-1 h-44">
        {sevenDays.map((d, index) => {
          const heightPct = Math.max(15, Math.round((d.count / maxCount) * 100))
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
              <span className="text-sm sm:text-base font-black text-text-strong">{d.count}</span>
              <div className="w-full max-w-[34px] flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${d.isToday ? 'bg-[var(--coral)] dark:bg-[var(--coral-deep)]' : 'bg-border-strong/90 dark:bg-border-strong'
                    }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-text-muted uppercase">{d.dayLabel}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs sm:text-sm font-bold text-text-secondary">
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-xs bg-[var(--coral)] dark:bg-[var(--coral-deep)]" />
          hoy y atrasado
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-xs bg-border-strong" />
          programado
        </span>
      </div>

      {/* Insight Box — only shown when there is a real upcoming peak to report */}
      {peakDay ? (
        <div className="rounded-2xl border border-border-subtle bg-field p-4 text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
          El {peakDay.dayLabel === 'HOY' ? 'próximo pico' : `día ${peakDay.dayLabel}`} se juntan{' '}
          <strong className="text-text-strong font-bold">{peakDay.count} repasos</strong>. Si hoy haces {todayCount}, ese pico baja a{' '}
          <strong className="text-text-strong font-bold">{peakReduced}</strong>.
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-field p-4 text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
          No hay repasos programados para los próximos días.
        </div>
      )}
    </div>
  )
}
