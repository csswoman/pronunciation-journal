import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Sound, UserContrastProgress } from "@/lib/phoneme-practice/types";

export {
  getAllSounds,
  getSoundById,
  getWordsBySound,
  getAllWords,
  getMinimalPairs,
  getAllContrastProgress,
  getContrastProgress,
  getContrastsForToday,
} from "@/lib/phoneme-practice/queries";

/** All contrast progress rows for a user, ordered by contrast_id. */
export async function getUserContrastProgress(
  userId: string,
): Promise<UserContrastProgress[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_contrast_progress")
    .select("*")
    .eq("user_id", userId)
    .order("contrast_id", { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserContrastProgress[];
}

/** Sound with the weakest contrast accuracy for the user, or null when no progress. */
export async function getWeakestSoundByProgress(userId: string): Promise<Sound | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("user_contrast_progress")
    .select("contrast_id, total_attempts, correct_answers")
    .eq("user_id", userId)
    .gt("total_attempts", 0);

  if (error) return null;
  if (!data || data.length === 0) return null;

  const byIpa = new Map<string, { correct: number; total: number }>();
  for (const r of data) {
    for (const ipa of r.contrast_id.split("|")) {
      const prev = byIpa.get(ipa) ?? { correct: 0, total: 0 };
      byIpa.set(ipa, {
        correct: prev.correct + r.correct_answers,
        total: prev.total + r.total_attempts,
      });
    }
  }

  const weakestIpa = [...byIpa.entries()]
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0]?.[0];

  if (!weakestIpa) return null;

  const { data: soundRows } = await supabase
    .from("sounds")
    .select("id, ipa, example, category, type, difficulty")
    .eq("ipa", weakestIpa)
    .limit(1);

  return (soundRows?.[0] as Sound | undefined) ?? null;
}

/** Sounds derived from contrasts due for SRS review today (up to 2 unique IPAs). */
export async function getDueSoundsForReview(userId: string): Promise<Sound[]> {
  const supabase = getSupabaseBrowserClient();
  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_contrast_progress")
    .select("contrast_id, next_review")
    .eq("user_id", userId)
    .or(`next_review.lte.${today},next_review.is.null`)
    .order("next_review", { ascending: true })
    .limit(4);

  if (error) return [];

  const seen = new Set<string>();
  const ipas: string[] = [];
  for (const r of data ?? []) {
    const [ipaA, ipaB] = r.contrast_id.split("|");
    for (const ipa of [ipaA, ipaB]) {
      if (!seen.has(ipa)) {
        seen.add(ipa);
        ipas.push(ipa);
      }
      if (ipas.length >= 2) break;
    }
    if (ipas.length >= 2) break;
  }

  if (ipas.length === 0) return [];

  const { data: soundRows } = await supabase
    .from("sounds")
    .select("id, ipa, example, category, type, difficulty")
    .in("ipa", ipas);

  return (soundRows ?? []) as Sound[];
}
