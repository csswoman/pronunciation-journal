import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { scheduleNextReview } from "@/lib/srs/schedule";
import type { WordBankEntry } from "@/lib/word-bank/types";

// ── Shared SM-2 state shape ──────────────────────────────────────────────────

export interface SM2Progress {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string | null;
  status: "new" | "learning" | "review" | "mastered";
  last_reviewed_at: string | null;
}

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

// ── SM-2 mapping layer: SM2Progress <-> shared scheduleNextReview ────────────
// Migrated to lib/srs/schedule.ts in May 2026. Pre-migration this used a
// non-canonical order (ease updated before interval). Canonical SM-2 order
// adopted; reviews with reps>=2 and grade>=3 shift by ~1-2 days.
export function computeSM2(current: SM2Progress | null, q: number): SM2Progress {
  const now = new Date();
  const next = scheduleNextReview({
    ease: current?.ease_factor ?? 2.5,
    interval: current?.interval_days ?? 1,
    repetitions: current?.repetitions ?? 0,
    grade: q,
    now,
    updateEaseOnLapse: false,
  });

  const status: SM2Progress["status"] =
    next.interval > 21 ? "mastered" : next.repetitions > 0 ? "review" : "learning";

  return {
    ease_factor: next.ease,
    interval_days: next.interval,
    repetitions: next.repetitions,
    next_review_at: next.nextReviewAt.toISOString(),
    status,
    last_reviewed_at: now.toISOString(),
  };
}

// ── wordBankSource: reads from word_bank, optionally filtered by deck ────────

export function wordBankSource(opts: {
  deckId?: string;
  smart?: "difficult";
  userId: string;
  deckLabel?: string;
}): StudySource {
  return {
    label: opts.deckLabel ?? (opts.smart === "difficult" ? "Difficult words" : "Word bank"),

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
          .select("*")
          .in("id", wordIds)
          .eq("user_id", opts.userId);

        words = (data ?? []) as WordBankEntry[];
      } else if (opts.smart === "difficult") {
        const { data } = await supabase
          .from("word_bank")
          .select("*")
          .eq("user_id", opts.userId)
          .gt("difficulty", 0);

        words = (data ?? []) as WordBankEntry[];
      } else {
        const { data } = await supabase
          .from("word_bank")
          .select("*")
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
