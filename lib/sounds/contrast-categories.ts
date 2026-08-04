import { getCanonicalSound } from "./inventory";
import type { MinimalPairContrast } from "./minimal-pairs";

export type ContrastCategory = "vowel" | "consonant";

export const DEFAULT_CONTRAST_CATEGORY: ContrastCategory = "vowel";

/** A contrast is a vowel contrast when both phonemes are vowels or diphthongs. */
function categoryForContrast(contrast: MinimalPairContrast): ContrastCategory {
  const typeA = getCanonicalSound(contrast.phonemeA)?.type;
  return typeA === "vowel" || typeA === "diphthong" ? "vowel" : "consonant";
}

export function contrastsByCategory(
  contrasts: MinimalPairContrast[],
): Record<ContrastCategory, MinimalPairContrast[]> {
  const grouped: Record<ContrastCategory, MinimalPairContrast[]> = {
    vowel: [],
    consonant: [],
  };
  for (const contrast of contrasts) {
    grouped[categoryForContrast(contrast)].push(contrast);
  }
  return grouped;
}
