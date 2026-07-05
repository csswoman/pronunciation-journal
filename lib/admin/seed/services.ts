import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  MinimalPair,
  Pattern,
  PatternWord,
  Sound,
  Word,
} from "@/lib/admin/seed/types";
import type { AdminSeedBody } from "@/lib/admin/seed/mutation-schemas";

function supabase() {
  return getSupabaseBrowserClient();
}

async function adminInsert(
  body: AdminSeedBody,
): Promise<{ error: { message: string } | null }> {
  const res = await fetch("/api/admin/seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: { message: json.error ?? `HTTP ${res.status}` } };
  }

  return { error: null };
}

export async function fetchSounds(): Promise<Sound[]> {
  const { data } = await supabase().from("sounds").select("id, ipa, type, category, example, difficulty").order("id");
  return (data as Sound[]) ?? [];
}

export async function insertSound(payload: {
  ipa: string;
  type: Sound["type"];
  category: string | null;
  example: string | null;
  difficulty: number | null;
}) {
  return adminInsert({ action: "insertSound", payload });
}

export async function fetchSoundsAndWords(): Promise<{ sounds: Sound[]; words: Word[] }> {
  const [{ data: soundsData }, { data: wordsData }] = await Promise.all([
    supabase().from("sounds").select("id, ipa, type, category, example, difficulty").order("id"),
    supabase().from("words").select("id, word, ipa, sound_id, difficulty, audio_url, sound_focus").order("id"),
  ]);

  return {
    sounds: (soundsData as Sound[]) ?? [],
    words: (wordsData as Word[]) ?? [],
  };
}

export async function insertWord(payload: {
  word: string;
  ipa: string | null;
  sound_id: number | null;
  sound_focus: string | null;
  difficulty: number | null;
  audio_url: string | null;
}) {
  return adminInsert({ action: "insertWord", payload });
}

export async function fetchPatternsAndPatternWords(): Promise<{ patterns: Pattern[]; patternWords: PatternWord[] }> {
  const [{ data: patternsData }, { data: patternWordsData }] = await Promise.all([
    supabase().from("patterns").select("id, pattern, type, sound_focus").order("id"),
    supabase().from("pattern_words").select("id, pattern_id, word, ipa").order("id"),
  ]);

  return {
    patterns: (patternsData as Pattern[]) ?? [],
    patternWords: (patternWordsData as PatternWord[]) ?? [],
  };
}

export async function insertPattern(payload: {
  pattern: string;
  type: string | null;
  sound_focus: string | null;
}) {
  return adminInsert({ action: "insertPattern", payload });
}

export async function insertPatternWord(payload: {
  pattern_id: number;
  word: string;
  ipa: string | null;
}) {
  return adminInsert({ action: "insertPatternWord", payload });
}

export async function fetchSoundsAndMinimalPairs(): Promise<{ sounds: Sound[]; pairs: MinimalPair[] }> {
  const [{ data: soundsData }, { data: pairsData }] = await Promise.all([
    supabase().from("sounds").select("id, ipa, type, category, example, difficulty").order("id"),
    supabase().from("minimal_pairs").select("id, word_a, word_b, ipa_a, ipa_b, sound_group, sound_a_id, sound_b_id, contrast_sound_a_id, contrast_sound_b_id, contrast_ipa_a, contrast_ipa_b").order("id"),
  ]);

  return {
    sounds: (soundsData as Sound[]) ?? [],
    pairs: (pairsData as MinimalPair[]) ?? [],
  };
}

export async function insertMinimalPair(payload: {
  word_a: string;
  word_b: string;
  ipa_a: string | null;
  ipa_b: string | null;
  sound_group: string | null;
  sound_a_id: number | null;
  sound_b_id: number | null;
  contrast_sound_a_id: number | null;
  contrast_sound_b_id: number | null;
  contrast_ipa_a: string | null;
  contrast_ipa_b: string | null;
}) {
  return adminInsert({ action: "insertMinimalPair", payload });
}
