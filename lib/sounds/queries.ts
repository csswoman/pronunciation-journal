import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Sound, UserContrastProgress } from "@/lib/phoneme-practice/types";
import { rankWeakestSounds } from "@/lib/phoneme-practice/mastery-pct";

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

/** Sound with the weakest dynamic mastery for the user, or null when no progress. */
export async function getWeakestSoundByProgress(userId: string): Promise<Sound | null> {
  const progress = await getUserContrastProgress(userId);
  const weakest = rankWeakestSounds(progress, { minAttempts: 1, limit: 1 })[0];
  if (!weakest) return null;

  const supabase = getSupabaseBrowserClient();
  const ipaKey = `/${weakest.ipa}/`;

  const { data: soundRows } = await supabase
    .from("sounds")
    .select("id, ipa, example, category, type, difficulty")
    .eq("ipa", ipaKey)
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
