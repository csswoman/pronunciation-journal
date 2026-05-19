import type { WordBankEntry, WordStrength, StrengthStats } from "@/lib/word-bank/types";

export function getWordStrength(word: Pick<WordBankEntry, "srs_status" | "ease_factor" | "repetitions">): WordStrength {
  if (word.srs_status === "mastered") return "strong";
  if (word.srs_status === "review") return "medium";
  return "weak";
}

export function computeStrengthStats(words: Pick<WordBankEntry, "srs_status" | "ease_factor" | "repetitions" | "status">[]): StrengthStats {
  const ready = words.filter(w => w.status === "ready");
  return {
    weak: ready.filter(w => getWordStrength(w) === "weak").length,
    medium: ready.filter(w => getWordStrength(w) === "medium").length,
    strong: ready.filter(w => getWordStrength(w) === "strong").length,
  };
}
