import { hasReduction, type CoreWord } from "@/lib/core-1000/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

/**
 * Source-agnostic view model for a word/concept presentation card. Both Core
 * 1000 (`CoreWord`) and the general word bank (`WordBankEntry`) map onto this
 * shape; the card renders each section only when its field is present, so the
 * Core-1000-specific extras (weak form, sentence IPA, chips) are all optional.
 */
export interface StudyCardModel {
  word: string;
  ipa?: string;
  meaning?: string;
  translation?: string;
  sentence?: string;
  sentenceIpa?: string;
  /** Function-word weak form: reduced IPA + the minimal phrase where it sounds natural. */
  weakForm?: { ipa: string; phrase: string };
  /** Metadata badges (e.g. rank, part of speech, CEFR level). */
  chips?: string[];
  /**
   * Learner-facing SRS state ("Nueva" / "La estás aprendiendo" / "En repaso" /
   * "Dominada"). Signals that the word keeps coming back until mastered. Only
   * present for word-bank cards, which carry an `srs_status`.
   */
  srsBadge?: string;
}

/** Maps a word_bank `srs_status` to a learner-readable badge, or undefined. */
function srsBadgeLabel(status: string | null | undefined): string | undefined {
  switch (status) {
    case "new":
      return "Nueva";
    case "learning":
      return "La estás aprendiendo";
    case "review":
      return "En repaso";
    case "mastered":
      return "Dominada";
    default:
      return undefined;
  }
}

/** Minimal phrase (word + next token) where a weak form sounds natural in TTS. */
export function weakFormPhrase(sentence: string, word: string): string {
  const tokens = sentence.match(/\b[\w']+\b/g) ?? [];
  const idx = tokens.findIndex((t) => t.toLowerCase() === word.toLowerCase());
  if (idx === -1) return word;
  return tokens.slice(idx, idx + 2).join(" ");
}

/** Drop empty/whitespace-only strings to a clean `undefined`. */
function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function coreWordToStudyCard(entry: CoreWord): StudyCardModel {
  return {
    word: entry.word,
    ipa: present(entry.ipa_strong),
    sentence: present(entry.example_sentence),
    sentenceIpa: present(entry.sentence_ipa),
    weakForm: hasReduction(entry)
      ? { ipa: entry.ipa_weak!, phrase: weakFormPhrase(entry.example_sentence, entry.word) }
      : undefined,
    chips: [`#${entry.rank}`, entry.pos, entry.cefr_level],
  };
}

export function wordBankEntryToStudyCard(entry: WordBankEntry): StudyCardModel {
  return {
    word: entry.text,
    ipa: present(entry.ipa),
    meaning: present(entry.meaning),
    translation: present(entry.translation),
    sentence: present(entry.example),
    srsBadge: srsBadgeLabel(entry.srs_status),
    // word_bank has no weak-form or sentence-IPA data.
  };
}
