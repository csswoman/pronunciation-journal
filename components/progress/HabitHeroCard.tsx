// Planned structure:
// <HabitHeroCard>
//   <PastelCard tone="sky">
//     <HeroPlanSection completedToday={streak.completedToday} />
//     <HeroStreakSection currentStreak={streak.currentStreak} maxStreak={streak.maxStreak} />
//     <HeroConsistencySection stats={dailyCompletion} weekly={weeklySummary} />
//   </PastelCard>
// </HabitHeroCard>

import PastelCard from "@/components/layout/PastelCard";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyCompletionStats, WeeklySummaryStats, ConsistencyHeatLevel } from "@/lib/progress/queries";
import { cn } from "@/lib/cn";

interface Props {
  streak: DailyStreakResult;
  dailyCompletion: DailyCompletionStats;
  weeklySummary: WeeklySummaryStats;
}

const HEAT_OPACITIES: Record<ConsistencyHeatLevel, string> = {
  0: "bg-ink/10 hover:bg-ink/20",
  1: "bg-ink/30 hover:bg-ink/40",
  2: "bg-ink/65 hover:bg-ink/75",
  3: "bg-ink hover:opacity-90",
};

export function HabitHeroCard({ streak, dailyCompletion, weeklySummary }: Props) {
  const { completedToday } = streak;
  const avgDaily = Math.round((weeklySummary.exercises7 / 7) * 10) / 10;

  return (
    <PastelCard tone="sky" className="p-5 sm:p-7 transition-all duration-300 hover:shadow-sm">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr] lg:gap-8 items-stretch">
        {/* Col 1: Plan Diario */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" />
              <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
                PLAN DIARIO
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight mt-2">
              {completedToday
                ? "Plan de hoy completado"
                : "Tu plan de hoy sigue sin abrir"}
            </h2>

            <p className="text-sm sm:text-base font-medium text-ink-secondary mt-3 leading-relaxed">
              {completedToday
                ? "¡Excelente consistencia! Has sumado tu práctica diaria de hoy."
                : "Unos minutos bastan para afianzar tu hábito de estudio."}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/10 text-sm font-semibold text-ink-secondary">
            {completedToday ? "✓ Práctica completada hoy" : "⏱️ Pendiente de inicio"}
          </div>
        </div>

        {/* Col 2: Consistencia */}
        <div className="flex flex-col justify-between h-full border-t lg:border-t-0 lg:border-l border-ink/10 pt-5 lg:pt-0 lg:pl-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
                CONSISTENCIA
              </span>
              <span className="inline-flex items-center rounded-full bg-ink/10 px-3 py-0.5 text-xs sm:text-sm font-bold text-ink transition-transform hover:scale-105">
                {dailyCompletion.completedDays30} de 30 días · {dailyCompletion.rate30}%
              </span>
            </div>

            {/* 30-day heatmap grid: 2 rows of 15 */}
            <div
              className="mt-3 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 overflow-x-auto no-scrollbar py-0.5"
              role="img"
              aria-label={`Mapa de actividad de los últimos 30 días: ${dailyCompletion.completedDays30} días cumplidos (${dailyCompletion.rate30}% del mes), ${dailyCompletion.activeDays30} días activos y ${dailyCompletion.planActivityDays30} días con actividad en el plan.`}
            >
              {dailyCompletion.heatmap30.map((level, i) => (
                <span
                  key={i}
                  title={`Día ${i + 1}: nivel de actividad ${level}`}
                  className={cn(
                    "aspect-square min-w-[12px] rounded-xs transition-transform hover:scale-125 duration-150 cursor-pointer",
                    HEAT_OPACITIES[level],
                  )}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-2.5 flex items-center justify-start gap-2 text-xs sm:text-sm text-ink-secondary" aria-hidden="true">
              <span>Menos</span>
              <div className="flex gap-1">
                <span className="h-3 w-3 rounded-xs bg-ink/10 border border-ink/20" />
                <span className="h-3 w-3 rounded-xs bg-ink/30" />
                <span className="h-3 w-3 rounded-xs bg-ink/65" />
                <span className="h-3 w-3 rounded-xs bg-ink" />
              </div>
              <span>Más</span>
            </div>

            {/* Active vs. plan-only days breakdown */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-ink/10 pt-2 text-xs sm:text-sm text-ink-secondary">
              <span>
                Días activos: <strong className="font-semibold text-ink">{dailyCompletion.activeDays30}</strong>
              </span>
              <span>
                En plan diario: <strong className="font-semibold text-ink">{dailyCompletion.planActivityDays30}</strong>
              </span>
            </div>
          </div>

          {/* Bottom stats row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3 text-xs sm:text-sm font-bold text-ink">
            <span>{weeklySummary.exercises7} ejercicios</span>
            <span>{avgDaily} / día</span>
            <span>{weeklySummary.newWords7} palabras nuevas</span>
          </div>
        </div>
      </div>
    </PastelCard>
  );
}
