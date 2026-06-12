import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { computeSM2, type SM2Progress } from "@/lib/srs/compute";
import type { WordBankEntry } from "@/lib/word-bank/types";

// Re-exported so existing consumers (e.g. StudyModalWordBank) keep their import.
// Canonical location is lib/srs/compute.ts.
export type { SM2Progress };

// ── Normalized card used by StudyModalWordBank ───────────────────────────────

export interface StudyCardData {
  id: string;
  front: string;
  ipa?: string | null;
  definition?: string | null;
  example?: string | null;
  audioUrl?: string | null;
  progress: SM2Progress | null;
}

// ── Source interface ─────────────────────────────────────────────────────────

export interface StudySource {
  label: string;
  loadCards(): Promise<StudyCardData[]>;
  saveProgress(cardId: string, q: number, current: SM2Progress | null): Promise<SM2Progress>;
}

// ── wordBankSource: reads from word_bank, optionally filtered by deck ────────

export function wordBankSource(opts: {
  deckId?: string;
  userId: string;
  deckLabel?: string;
}): StudySource {
  return {
    label: opts.deckLabel ?? "Word bank",

    async loadCards(): Promise<StudyCardData[]> {
      const supabase = getSupabaseBrowserClient();
      let words: WordBankEntry[] = [];

      if (opts.deckId) {
        const { data: links } = await supabase
          .from("word_bank_decks")
          .select("word_id")
          .eq("deck_id", opts.deckId);

        if (!links?.length) return [];

        const wordIds = links.map(l => l.word_id);
        const { data } = await supabase
          .from("word_bank")
          .select("id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at")
          .in("id", wordIds)
          .eq("user_id", opts.userId);

        words = (data ?? []) as WordBankEntry[];
      } else {
        const { data } = await supabase
          .from("word_bank")
          .select("id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at")
          .eq("user_id", opts.userId);

        words = (data ?? []) as WordBankEntry[];
      }

      const now = new Date();
      return words
        .filter(w => w.status === "ready")
        .filter(w => !w.next_review_at || new Date(w.next_review_at) <= now)
        .sort(() => Math.random() - 0.5)
        .map(w => ({
          id: w.id,
          front: w.text,
          ipa: w.ipa,
          definition: w.meaning ?? w.translation ?? null,
          example: w.example ?? null,
          audioUrl: w.audio_url ?? null,
          progress: w.next_review_at || w.srs_status !== "new" ? {
            ease_factor: w.ease_factor,
            interval_days: w.interval_days,
            repetitions: w.repetitions,
            next_review_at: w.next_review_at,
            status: w.srs_status as SM2Progress["status"],
            last_reviewed_at: w.last_reviewed_at,
          } : null,
        }));
    },

    async saveProgress(cardId: string, q: number, current: SM2Progress | null): Promise<SM2Progress> {
      const next = computeSM2(current, q);
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("word_bank")
        .update({
          ease_factor: next.ease_factor,
          interval_days: next.interval_days,
          repetitions: next.repetitions,
          next_review_at: next.next_review_at,
          srs_status: next.status,
          last_reviewed_at: next.last_reviewed_at,
        })
        .eq("id", cardId)
        .eq("user_id", opts.userId);
      return next;
    },
  };
}
