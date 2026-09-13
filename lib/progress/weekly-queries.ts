import { getDailyStreak } from '@/lib/daily/streak'
import type { DailyStreakResult } from '@/lib/daily/streak-core'
import {
  getDailyCompletionStats,
  getWeeklySummaryStats,
  type ConsistencyHeatLevel,
  type WeeklySummaryStats,
} from './queries'

/**
 * Corte semanal del progreso, para el sidebar de /daily.
 *
 * No añade queries nuevas: reusa las de la página de progreso y recorta la
 * ventana a 7 días. El heatmap de 7 se toma de la cola del de 30, que ya viene
 * ordenado de más antiguo a hoy.
 */
export interface WeeklyProgressData {
  streak: DailyStreakResult
  summary: WeeklySummaryStats
  /** Últimos 7 días, del más antiguo a hoy. */
  heatmap7: ConsistencyHeatLevel[]
  /** Días de los últimos 7 que alcanzaron el umbral diario. */
  completedDays7: number
  /** Porcentaje 0-100 de días completados en la semana. */
  rate7: number
}

export async function getWeeklyProgressData(userId: string): Promise<WeeklyProgressData> {
  const [streak, summary, completion] = await Promise.all([
    getDailyStreak(userId),
    getWeeklySummaryStats(userId),
    getDailyCompletionStats(userId),
  ])

  return {
    streak,
    summary,
    heatmap7: completion.heatmap30.slice(-7),
    completedDays7: completion.completedDays7,
    rate7: completion.rate7,
  }
}
