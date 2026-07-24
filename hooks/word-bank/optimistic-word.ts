import type { WordBankEntry } from "@/lib/word-bank/types";

export function createOptimisticWord(input: {
  id: string;
  userId: string;
  text: string;
  context?: string | null;
  now?: string;
}): WordBankEntry {
  const timestamp = input.now ?? new Date().toISOString();

  return {
    id: input.id,
    user_id: input.userId,
    text: input.text,
    context: input.context ?? null,
    meaning: null,
    translation: null,
    ipa: null,
    example: null,
    synonyms: null,
    image_prompt: null,
    audio_url: null,
    status: "processing",
    difficulty: 0,
    error_reason: null,
    audio_fetch_attempts: 0,
    has_audio: null,
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    srs_status: "new",
    next_review_at: null,
    last_reviewed_at: null,
    review_count: 0,
    source: null,
    source_ref: null,
    is_favorite: false,
    familiarity_confidence: 0,
    familiarity_status: "unknown",
    mastery_provenance: "none",
    mastery_version: 1,
    objective_evidence_count: 0,
    verification_due_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
