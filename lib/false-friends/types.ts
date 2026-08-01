/**
 * False friends — English words a Spanish speaker predictably misreads because
 * they look like a Spanish word with a different meaning.
 *
 * Authored JSON lives in public/false-friends/, validated by ./schema.
 *
 * Each entry models the full trap, not just the word:
 *   - `word`        the English word that misleads          → "actually"
 *   - `looksLike`   the Spanish word it resembles           → "actualmente"
 *   - `actualMeaning` what it really means, in Spanish      → "en realidad"
 *   - `correctWord` what you *should* say for `looksLike`   → "currently"
 *
 * Practice is contextual choice: a sentence with a gap plus distractors, so the
 * learner makes the real decision instead of reciting a definition.
 */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

/** CEFR levels used by the false-friends dataset, easiest → hardest. */
export const CEFR_LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"] as const;

/**
 * How the confusion is triggered. Kept small on purpose — this bank is lexical
 * only; structural calques ("I have 25 years") belong to the grammar decks.
 */
export const FALSE_FRIEND_KINDS = [
  /** Same root, diverged meaning: actually / actualmente. */
  "meaning-shift",
  /** Meanings overlap partially, so it is right sometimes: assist / asistir. */
  "partial-overlap",
  /** No relation at all despite the shape: embarrassed / embarazada. */
  "unrelated",
] as const;
export type FalseFriendKind = (typeof FALSE_FRIEND_KINDS)[number];

/** One multiple-choice item: a gapped sentence plus the options to choose from. */
export interface FalseFriendPrompt {
  /** Sentence containing exactly one `___` gap. */
  sentence: string;
  /** Choices shown to the learner; exactly one is correct. */
  options: string[];
  /** Index into `options` of the correct choice. */
  answer: number;
  /** Short Spanish explanation shown after answering. */
  explain: string;
}

export interface FalseFriend {
  /** Stable slug, kebab-case, unique across the bank. Usually the word itself. */
  id: string;
  /** The misleading English word. */
  word: string;
  /** The Spanish word it is mistaken for. */
  looksLike: string;
  /** What the English word actually means, written in Spanish. */
  actualMeaning: string;
  /** The English word that really expresses `looksLike`. */
  correctWord: string;
  kind: FalseFriendKind;
  cefr_level: CefrLevel;
  /** Contextual-choice items. At least one; two lets the SRS vary the ask. */
  prompts: FalseFriendPrompt[];
  /** Optional note for cases where the trap has an exception worth flagging. */
  note?: string;
}

export const FALSE_FRIENDS_PREFIX = "ff:";

/** srsData wordId for a false-friend card (namespaced, lowercase). */
export function falseFriendId(id: string): string {
  return `${FALSE_FRIENDS_PREFIX}${id.toLowerCase()}`;
}
