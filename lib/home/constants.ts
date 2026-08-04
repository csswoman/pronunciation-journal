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
  /** Practice minutes in the current calendar week (America/Lima). */
  weekMinutes: number;
}

export interface WeakestPhonemeHome {
  ipa: string;
  /** Mastery 0–100 (for qualitative fallbacks). */
  accuracy: number;
  totalAttempts: number;
  correctAnswers: number;
  /** Partner IPA from the weakest contrast, if known. */
  confusableIpa: string | null;
  label: string | null;
}

/** Resumen ligero de un paso de la diaria para mostrar en el home. */
export interface DailyStepPreview {
  id: string;
  title: string;
  subtitle: string;
  /** Icon name (Tabler via @/components/icons; ver components/daily/dailyIcons). */
  icon: string;
}

/** Preview de la diaria del día (sin generar ejercicios). */
export interface DailyPlanPreview {
  steps: DailyStepPreview[];
  isNewUser: boolean;
  estMinutes: number;
}

/** A source's count feels urgent at or above this many scheduled reviews. */
export const REVIEW_URGENCY_THRESHOLD = 10;

export type ReviewSourceId = "vocabulary" | "essential" | "sounds";

export interface ReviewSource {
  id: ReviewSourceId;
  label: string;
  /** Strictly scheduled-due: next_review <= now (never new/null). */
  count: number;
  href: string;
  /** warning when count >= REVIEW_URGENCY_THRESHOLD */
  tone: "primary" | "warning";
}

export interface ReviewPreviewItem {
  id: string;
  text: string;
  ipa: string | null;
  translation: string | null;
  sourceId: ReviewSourceId;
}

export interface ReviewQueueSummary {
  /** Sum of server-known source counts (essential merged client-side). */
  total: number;
  /** New/unseen items available — powers the forward CTA, NOT part of total. */
  newAvailable: number;
  /** Only sources with count > 0, ordered by count desc. */
  sources: ReviewSource[];
  preview: ReviewPreviewItem[];
}

/** Maps a source id to its session route. */
export const REVIEW_SOURCE_HREF: Record<ReviewSourceId, string> = {
  vocabulary: "/practice/review",
  essential: "/practice/essential-words",
  sounds: "/practice/sounds",
};

export const REVIEW_SOURCE_LABEL: Record<ReviewSourceId, string> = {
  vocabulary: "Vocabulario",
  essential: "Palabras esenciales",
  sounds: "Sonidos",
}

/** Derives tone from a count. Keeps presentation logic out of components. */
export function reviewToneForCount(count: number): "primary" | "warning" {
  return count >= REVIEW_URGENCY_THRESHOLD ? "warning" : "primary";
}
