import type { Tables } from "@/lib/supabase/types";

// ── Row status unions ────────────────────────────────────────────────────────

export type WordBankStatus = "processing" | "ready" | "failed";

export type WordBankSrsStatus = "new" | "learning" | "review" | "mastered";

/**
 * Word bank row. Sourced directly from the generated Supabase types so the
 * shape never drifts from the `word_bank` table — regenerate `lib/supabase/types.ts`
 * to pick up schema changes.
 *
 * Note: `status`, `srs_status` and `error_reason` are `string` here because
 * Postgres CHECK constraints are not reflected in generated types. Use the
 * `WordBankStatus` / `WordBankSrsStatus` unions when a narrowed value is needed.
 */
export type WordBankEntry = Tables<"word_bank"> & { is_favorite?: boolean };

// ── Enrichment ───────────────────────────────────────────────────────────────

export interface WordEnrichment {
  meaning: string;
  translation: string;
  ipa: string;
  example: string;
  synonyms: string[];
  image_prompt: string;
}

// ── Strength ─────────────────────────────────────────────────────────────────

export type WordStrength = "weak" | "medium" | "strong";

export interface StrengthStats {
  weak: number;
  medium: number;
  strong: number;
}

// ── Audio ────────────────────────────────────────────────────────────────────

export interface AudioFetchResult {
  url: string | null;
  hasAudio: boolean | null;
}
