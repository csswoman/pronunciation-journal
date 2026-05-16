import type { WordBankEntry } from "@/lib/types";

export type WordStrength = "weak" | "medium" | "strong";

export function getWordStrength(word: Pick<WordBankEntry, "srs_status" | "ease_factor" | "repetitions">): WordStrength {
  if (word.srs_status === "mastered") return "strong";
  if (word.srs_status === "review") return "medium";
  return "weak";
}

export interface StrengthStats {
  weak: number;
  medium: number;
  strong: number;
}

export function computeStrengthStats(words: Pick<WordBankEntry, "srs_status" | "ease_factor" | "repetitions" | "status">[]): StrengthStats {
  const ready = words.filter(w => w.status === "ready");
  return {
    weak: ready.filter(w => getWordStrength(w) === "weak").length,
    medium: ready.filter(w => getWordStrength(w) === "medium").length,
    strong: ready.filter(w => getWordStrength(w) === "strong").length,
  };
}
