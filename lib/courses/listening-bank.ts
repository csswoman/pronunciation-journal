// Curated listening bank for level checkpoints (Plan 033).
//
// Pedagogy (MCER / CEFR listening descriptors, companion volume): a fixed
// format — short two-speaker dialogues at each level — where only the
// language complexity and the required inference vary across levels. Each clip
// carries TWO questions (main idea + detail) so promotion has real evidence and
// cannot be passed by a single lucky multiple-choice guess.
//
// SECURITY CONTRACT (Plan 033 STOP conditions):
//   - `transcript` and the correct `answer` are SERVER-ONLY. They must never be
//     serialized into the initial client payload. Use `toClientListeningItem`
//     to derive the shape safe to send to the browser before the learner
//     answers. The transcript may be revealed only AFTER answering.
//   - IDs are stable and deterministic so the client build and the server
//     rescore reconstruct exactly the same items and answer keys.
//   - Audio is pre-generated offline from `lines` into stable WAV assets under
//     `public/listening/`. The dialogue text is NOT derived at runtime from a
//     visible prompt.

import type { CefrLevelId } from "@/lib/courses/types";
import { A1_LISTENING_ITEMS } from "@/lib/courses/listening-bank-data/a1";
import { A2_LISTENING_ITEMS } from "@/lib/courses/listening-bank-data/a2";
import { B1_LISTENING_ITEMS } from "@/lib/courses/listening-bank-data/b1";
import { B2_LISTENING_ITEMS } from "@/lib/courses/listening-bank-data/b2";
import { C1_LISTENING_ITEMS } from "@/lib/courses/listening-bank-data/c1";
import { C2_LISTENING_ITEMS } from "@/lib/courses/listening-bank-data/c2";

/** A single spoken line in a dialogue, mapped to one speaker + one voice. */
export interface ListeningLine {
  /** "A" or "B": stable speaker key within the clip. Drives voice selection. */
  speaker: "A" | "B";
  /** English text to synthesize. SERVER-ONLY — part of the transcript. */
  text: string;
}

/** One comprehension question about a clip. Multiple choice, single answer. */
export interface ListeningQuestion {
  /** Stable id, unique within the assessment. */
  id: string;
  /** What the question probes, for reporting and balance. */
  focus: "main-idea" | "detail";
  /** Spanish is avoided; prompt stays in English to keep the task authentic. */
  prompt: string;
  options: string[];
  /** Index into `options`. SERVER-ONLY — never sent before answering. */
  answer: number;
}

/** A curated listening clip: one short dialogue + its questions. */
export interface ListeningItem {
  /** Stable clip id, e.g. "a1:listening:cafe". */
  id: string;
  level: CefrLevelId;
  /** Lesson slug this clip reports under, consistent with topicScores. */
  lessonSlug: string;
  /** Audio type per the MCER table, for authoring/QA reference. */
  audioKind: string;
  /** SERVER-ONLY dialogue lines used to pre-generate audio and reveal later. */
  lines: ListeningLine[];
  questions: ListeningQuestion[];
}

/** Client-safe projection: no transcript, no answer key. */
export interface ClientListeningItem {
  id: string;
  level: CefrLevelId;
  lessonSlug: string;
  /** Stable public URL of the pre-generated audio for this clip. */
  audioSrc: string;
  questions: Array<{
    id: string;
    focus: "main-idea" | "detail";
    prompt: string;
    options: string[];
  }>;
}

/** Public path where the pre-generated WAV for a clip lives. */
export function listeningAudioSrc(clipId: string): string {
  // Colon is not filesystem-friendly on Windows; use a stable slug.
  return `/listening/${clipId.replaceAll(":", "-")}.wav`;
}

/**
 * Strips server-only fields (transcript lines and answer keys) so the item is
 * safe to send to the browser before the learner answers.
 */
export function toClientListeningItem(item: ListeningItem): ClientListeningItem {
  return {
    id: item.id,
    level: item.level,
    lessonSlug: item.lessonSlug,
    audioSrc: listeningAudioSrc(item.id),
    questions: item.questions.map((q) => ({
      id: q.id,
      focus: q.focus,
      prompt: q.prompt,
      options: q.options,
    })),
  };
}
/** Stable CEFR order used by the bank, UI and audio generator. */
export const LISTENING_LEVEL_ORDER: CefrLevelId[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

/** Three curated clips per CEFR level, retaining each original clip. */
export const LISTENING_BANK: Record<CefrLevelId, ListeningItem[]> = {
  a1: A1_LISTENING_ITEMS,
  a2: A2_LISTENING_ITEMS,
  b1: B1_LISTENING_ITEMS,
  b2: B2_LISTENING_ITEMS,
  c1: C1_LISTENING_ITEMS,
  c2: C2_LISTENING_ITEMS,
};

/** Flat list of every clip, deterministic order. */
export function allListeningItems(): ListeningItem[] {
  return LISTENING_LEVEL_ORDER.flatMap((level) => LISTENING_BANK[level]);
}
