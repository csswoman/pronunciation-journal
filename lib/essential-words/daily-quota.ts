import type { EssentialWordsStats } from "@/hooks/useEssentialWordsSession";

/**
 * True once the learner has hit today's new-word quota and has no reviews
 * left due today. Used to show a "you're done for today, keep going if you
 * want" banner on the ready screen instead of repeating "Hoy te tocan N".
 */
export function isDailyQuotaMet(stats: EssentialWordsStats): boolean {
  return stats.newToday >= stats.newQuota && stats.dueCount === 0;
}
