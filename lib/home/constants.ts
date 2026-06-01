/** Daily practice time target shown on the home ring (minutes). */
export const DEFAULT_DAILY_GOAL_MINUTES = 20;

export interface DailyGoalProgress {
  minutesDone: number;
  goalMinutes: number;
  percent: number;
}

export interface WeakestPhonemeHome {
  ipa: string;
  accuracy: number;
  totalAttempts: number;
  label: string | null;
}
