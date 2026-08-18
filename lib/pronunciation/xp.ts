/**
 * XP from a 0–100 accuracy score.
 * Kept separate from scoring.ts so home/daily plan does not pull phoneme analysis.
 */
export function calculateXP(accuracy: number): number {
  if (accuracy >= 95) return 15;
  if (accuracy >= 80) return 10;
  if (accuracy >= 60) return 5;
  if (accuracy >= 40) return 2;
  return 1;
}
