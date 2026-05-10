import type { PhonemeAlignment } from "@/lib/types";

export interface WordIPA {
  word: string;
  ipa: string | null;
  alignment: PhonemeAlignment[] | null;
}

export type SoundProgress = Record<string, { correct: number; total: number }>;
