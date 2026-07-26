import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WordEnrichment } from "@/lib/word-bank/types";

const TABLE = "word_definitions";

export type DefinitionSource = "dictionary" | "gemini";

export function normalizeWord(text: string): string {
  return text.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function toEnrichment(row: {
  meaning: string;
  translation: string;
  ipa: string;
  example: string;
  synonyms: string[];
  image_prompt: string;
}): WordEnrichment {
  return {
    meaning: row.meaning,
    translation: row.translation,
    ipa: row.ipa,
    example: row.example,
    synonyms: row.synonyms,
    image_prompt: row.image_prompt,
  };
}

export async function getCachedWordDefinition(text: string): Promise<WordEnrichment | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("meaning, translation, ipa, example, synonyms, image_prompt")
    .eq("normalized_text", normalizeWord(text))
    .maybeSingle();

  if (error) throw error;
  return data ? toEnrichment(data) : null;
}

/**
 * Creates a generic dictionary entry only on a cache miss. A unique key makes
 * concurrent first lookups converge on one stored definition.
 */
export async function getOrCreateWordDefinition(
  text: string,
  create: () => Promise<WordEnrichment>,
): Promise<{ enrichment: WordEnrichment; source: DefinitionSource }> {
  const cached = await getCachedWordDefinition(text);
  if (cached) return { enrichment: cached, source: "dictionary" };

  const enrichment = await create();
  if (!enrichment.meaning || !enrichment.translation) {
    throw new Error("Word definition is incomplete");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).insert({
    text: text.trim(),
    normalized_text: normalizeWord(text),
    meaning: enrichment.meaning,
    translation: enrichment.translation,
    ipa: enrichment.ipa,
    example: enrichment.example,
    synonyms: enrichment.synonyms,
    image_prompt: enrichment.image_prompt,
    source: "gemini",
  });

  if (!error) return { enrichment, source: "gemini" };
  if (error.code !== "23505") throw error;

  const concurrent = await getCachedWordDefinition(text);
  if (!concurrent) throw error;
  return { enrichment: concurrent, source: "dictionary" };
}
