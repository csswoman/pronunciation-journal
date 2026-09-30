/**
 * lexicon-mark.ts — Operaciones de marcado de aprendizaje y dominio para
 * palabras del lexicon curado. Mantiene estas funciones separadas de queries.ts
 * para respetar el límite de 250 líneas por archivo.
 */
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WordBankEntry } from "@/lib/word-bank/types";

const TABLE = "word_bank";

const WB_FULL_COLS =
  "id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at, updated_at";

export interface LexiconWordInput {
  sourceRef: string;       // lexicon word id
  text: string;
  definition: string;
  example?: string | null;
  ipa?: string | null;
  audioUrl?: string | null;
  difficulty?: number;
}

/**
 * Idempotent "mark learned" from the lexicon.
 *
 * Merge policy:
 *   - Match on (user_id, text) — case-insensitive via lower().
 *   - If already in word_bank: return existing row untouched (no SRS reset, no source overwrite).
 *   - If new: insert with source='lexicon', status='ready', enrichment pre-filled.
 *
 * Returns { entry, alreadyExisted }.
 */
export async function markLexiconWordLearned(
  input: LexiconWordInput
): Promise<{ entry: WordBankEntry; alreadyExisted: boolean }> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: selectError } = await supabase
    .from(TABLE)
    .select(WB_FULL_COLS)
    .eq("user_id", user.id)
    .ilike("text", input.text)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return { entry: existing as WordBankEntry, alreadyExisted: true };

  const { data: inserted, error: insertError } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      text: input.text,
      meaning: input.definition,
      example: input.example ?? null,
      ipa: input.ipa ?? null,
      audio_url: input.audioUrl ?? null,
      difficulty: input.difficulty ?? 0,
      status: "ready",
      source: "lexicon",
      source_ref: input.sourceRef,
    })
    .select(WB_FULL_COLS)
    .single();

  if (insertError) throw insertError;
  return { entry: inserted as WordBankEntry, alreadyExisted: false };
}

/**
 * Idempotent "ya la domino" — auto-report de dominio para palabras que el
 * usuario ya conoce de memoria (ej. "house").
 *
 * Merge policy:
 *   - Si ya existe en word_bank: aplica mastery sin resetear SRS ni source.
 *   - Si no existe: inserta con source='lexicon' y la marca como mastered.
 *
 * Usa mastery_provenance='legacy_self_report' para distinguirlo del dominio
 * verificado por ejercicios (objetivo). Se muestra como "Dominada" en la UI
 * pero sin el peso de una verificación real.
 */
export async function markLexiconWordMastered(
  input: LexiconWordInput
): Promise<{ entry: WordBankEntry; alreadyExisted: boolean }> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const masteryPatch = {
    srs_status: "mastered" as const,
    mastery_provenance: "legacy_self_report",
    familiarity_status: "familiar",
    familiarity_confidence: 100,
  };

  const { data: existing, error: selectError } = await supabase
    .from(TABLE)
    .select(WB_FULL_COLS)
    .eq("user_id", user.id)
    .eq("source_ref", input.sourceRef)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update(masteryPatch)
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select(WB_FULL_COLS)
      .single();
    if (updateError) throw updateError;
    return { entry: updated as WordBankEntry, alreadyExisted: true };
  }

  const { data: inserted, error: insertError } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      text: input.text,
      meaning: input.definition,
      example: input.example ?? null,
      ipa: input.ipa ?? null,
      audio_url: input.audioUrl ?? null,
      difficulty: input.difficulty ?? 0,
      status: "ready",
      source: "lexicon",
      source_ref: input.sourceRef,
      ...masteryPatch,
    })
    .select(WB_FULL_COLS)
    .single();

  if (insertError) throw insertError;
  return { entry: inserted as WordBankEntry, alreadyExisted: false };
}
