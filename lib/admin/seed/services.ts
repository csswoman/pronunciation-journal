import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  MinimalPair,
  Pattern,
  PatternWord,
  Sound,
  Word,
} from "@/lib/admin/seed/types";

function supabase() {
  return getSupabaseBrowserClient();
}

export async function fetchSounds(): Promise<Sound[]> {
  const { data } = await supabase().from("sounds").select("*").order("id");
  return (data as Sound[]) ?? [];
}

export async function insertSound(payload: {
  ipa: string;
  type: Sound["type"];
  category: string | null;
  example: string | null;
  difficulty: number | null;
}) {
  return supabase().from("sounds").insert(payload);
}

export async function fetchSoundsAndWords(): Promise<{ sounds: Sound[]; words: Word[] }> {
  const [{ data: soundsData }, { data: wordsData }] = await Promise.all([
    supabase().from("sounds").select("*").order("id"),
    supabase().from("words").select("*").order("id"),
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
  return supabase().from("words").insert(payload);
}

export async function fetchPatternsAndPatternWords(): Promise<{ patterns: Pattern[]; patternWords: PatternWord[] }> {
  const [{ data: patternsData }, { data: patternWordsData }] = await Promise.all([
    supabase().from("patterns").select("*").order("id"),
    supabase().from("pattern_words").select("*").order("id"),
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
  return supabase().from("patterns").insert(payload);
}

export async function insertPatternWord(payload: {
  pattern_id: number;
  word: string;
  ipa: string | null;
}) {
  return supabase().from("pattern_words").insert(payload);
}

export async function fetchSoundsAndMinimalPairs(): Promise<{ sounds: Sound[]; pairs: MinimalPair[] }> {
  const [{ data: soundsData }, { data: pairsData }] = await Promise.all([
    supabase().from("sounds").select("*").order("id"),
    supabase().from("minimal_pairs").select("*").order("id"),
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
  return supabase().from("minimal_pairs").insert(payload);
}
