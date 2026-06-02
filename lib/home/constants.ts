/** Daily practice time target shown on the home ring (minutes). */
export const DEFAULT_DAILY_GOAL_MINUTES = 20;

/** Un sonido con SRS vencido para mostrar en la cola de repaso del home. */
export interface SoundDueHome {
  soundId: number;
  ipa: string;
  example: string | null;
  /** Accuracy 0–100 basada en total_attempts/correct_answers. */
  accuracy: number;
  /** Días desde que se vence el repaso (0 = hoy, >0 = vencido). */
  daysOverdue: number;
}

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

/** Resumen ligero de un paso de la diaria para mostrar en el home. */
export interface DailyStepPreview {
  id: string;
  title: string;
  subtitle: string;
  /** lucide-react icon name (ver components/daily/dailyIcons). */
  icon: string;
}

/** Preview de la diaria del día (sin generar ejercicios). */
export interface DailyPlanPreview {
  steps: DailyStepPreview[];
  isNewUser: boolean;
  estMinutes: number;
}
