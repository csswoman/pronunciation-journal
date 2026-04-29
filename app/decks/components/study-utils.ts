import type { Tables } from "@/lib/supabase/types";

export type Progress = Tables<"deck_entry_progress">;

export const LEVEL_LABELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const LEVEL_NAMES: Record<string, string> = {
  A1: "Beginner", A2: "Elementary", B1: "Intermediate",
  B2: "Upper-Intermediate", C1: "Advanced", C2: "Proficient",
};
export const DOT_COLORS = ["#a78bfa", "#fb923c", "#4ade80", "#60a5fa", "#f472b6"];
export const STUDY_TIPS = [
  "Try to use the word in a sentence before checking the answer.",
  "Visualize the word in an everyday context to remember it better.",
  "Connect this word to something you already know.",
  "Say the word out loud — it helps lock it into memory.",
];

export const RATING_CONFIG = {
  again: {
    label: "Hard",
    sublabel: "Didn't remember",
    q: 1,
    bg: "var(--error-soft)",
    border: "var(--error)",
    color: "var(--error)",
  },
  hard: {
    label: "Medium",
    sublabel: "Remembered with effort",
    q: 3,
    bg: "var(--warning-soft)",
    border: "var(--warning)",
    color: "var(--warning)",
  },
  easy: {
    label: "Easy",
    sublabel: "Remembered it well",
    q: 5,
    bg: "var(--success-soft)",
    border: "var(--success)",
    color: "var(--success)",
  },
} as const;

export function sm2(
  progress: Progress,
  q: number
): Omit<Progress, "id" | "user_id" | "entry_id" | "created_at"> {
  const now = new Date().toISOString();
  let { ease_factor, interval_days, repetitions } = progress;
  if (q < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  }
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval_days);
  const status: Progress["status"] =
    interval_days > 21 ? "mastered" : repetitions > 0 ? "review" : "learning";
  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    next_review_at: nextReview.toISOString(),
    status,
    last_reviewed_at: now,
    updated_at: now,
  };
}

export function previewInterval(progress: Progress | null, q: number): string {
  if (q < 3) return "in 10 min";
  let ease_factor = progress?.ease_factor ?? 2.5;
  let interval_days = progress?.interval_days ?? 1;
  const repetitions = progress?.repetitions ?? 0;
  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (repetitions === 0) interval_days = 1;
  else if (repetitions === 1) interval_days = 6;
  else interval_days = Math.round(interval_days * ease_factor);
  if (interval_days <= 1) return "in 1 day";
  if (interval_days < 7) return `in ${interval_days} days`;
  const weeks = Math.round(interval_days / 7);
  return weeks === 1 ? "in 1 week" : `in ${weeks} weeks`;
}

export function timeUntil(isoDate: string | undefined | null): string {
  if (!isoDate) return "new";
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days} days`;
}

export function speakWord(word: string) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

export function blankOutWord(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped, "gi"), "___");
}
