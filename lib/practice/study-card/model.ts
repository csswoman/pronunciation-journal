import { hasReduction, type EssentialWord } from "@/lib/essential-words/types";
import { essentialWordPosLabel } from "@/lib/essential-words/pos-label";
import { displayEnglishText, displayEnglishWord } from "@/lib/essential-words/word-display";
import type { WordBankEntry } from "@/lib/word-bank/types";
import { compileMarkedText, type CompiledMarkedText } from "@/lib/essential-words/study-markup";
import { STUDY_RULES } from "@/lib/essential-words/study-rules";

type EssentialMetadataEntry = WordBankEntry & {
  essentialMetadata?: {
    rank: number;
    pos: EssentialWord["pos"];
    cefr_level: EssentialWord["cefr_level"];
  };
};

/**
 * Source-agnostic view model for a word/concept presentation card. Both Core
 * 1000 (`EssentialWord`) and the general word bank (`WordBankEntry`) map onto this
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
  /** Metadata badges (e.g. rank, part of speech). */
  chips?: string[];
  /** CEFR level (A1–C1), rendered as a distinct accent badge. */
  levelBadge?: string;
  /**
   * Learner-facing SRS state ("Nueva" / "La estás aprendiendo" / "En repaso" /
   * "Dominada"). Signals that the word keeps coming back until mastered. Only
   * present for word-bank cards, which carry an `srs_status`.
   */
  srsBadge?: string;
  /** Rich, authored-and-validated teaching content for Core 1000 entries. */
  study?: StudyCardStudy;
}

export interface StudyCardStudy {
  definitionEs?: string;
  translation?: string[];
  translationNote?: string;
  spellingVariants?: Array<{ spelling: string; localeEs: string }>;
  usageRuleEs?: string;
  pronunciation?: {
    soundAnchors: Array<{ id: string; ipa: string; explanationEs: string }>;
    variants: Array<{ id: string; labelEs: string; ipa: string; spokenExample: CompiledMarkedText; ttsText: string; anchorIds: string[] }>;
  };
  contrasts?: {
    titleEs: string;
    pairs: Array<{
      pattern: "omission" | "addition" | "replacement" | "false_friend";
      spanish: CompiledMarkedText;
      english: CompiledMarkedText;
      explanationEs?: string;
      ttsText: string;
    }>;
  };
  examples?: Array<{ english: CompiledMarkedText; translationEs: string; variantId?: string; ttsText: string }>;
}

/**
 * Presentation view model for one false-friend pair. Mirrors the noticing role
 * of `StudyCardModel` but carries a contrast instead of a single word: the trap,
 * what it is mistaken for, what it really means, and what to say instead.
 */
export interface FalseFriendIntro {
  /** The misleading English word. */
  word: string;
  /** The Spanish word it is mistaken for. */
  looksLike: string;
  /** What the English word actually means, in Spanish. */
  actualMeaning: string;
  /** The English word that really expresses `looksLike`. */
  correctWord: string;
  levelBadge?: string;
  /** Optional caveat (e.g. partial overlap, social risk). */
  note?: string;
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

function studyCardStudy(entry: EssentialWord): StudyCardStudy | undefined {
  const study = entry.study;
  if (!study) return undefined;

  return {
    definitionEs: present(study.definitionEs),
    translation: study.translation,
    translationNote: present(study.translationNote),
    spellingVariants: study.spellingVariants,
    usageRuleEs: study.usage?.ruleEsOverride ?? (study.usage?.ruleId ? STUDY_RULES[study.usage.ruleId as keyof typeof STUDY_RULES] : undefined),
    pronunciation: study.pronunciation ? {
      soundAnchors: study.pronunciation.soundAnchors ?? [],
      variants: (study.pronunciation.variants ?? []).map((variant) => {
        const spokenExample = compileMarkedText(displayEnglishText(variant.spokenExample));
        return {
          id: variant.id,
          labelEs: variant.labelEs,
          ipa: variant.ipa,
          spokenExample,
          ttsText: variant.ttsTextOverride ?? spokenExample.text,
          anchorIds: variant.anchorIds,
        };
      }),
    } : undefined,
    contrasts: study.contrasts ? {
      titleEs: study.contrasts.titleEs,
      pairs: study.contrasts.pairs.map((pair) => {
        const english = compileMarkedText(displayEnglishText(pair.english));
        return {
          pattern: pair.pattern,
          spanish: compileMarkedText(pair.spanish),
          english,
          explanationEs: present(pair.explanationEs),
          ttsText: pair.ttsTextOverride ?? english.text,
        };
      }),
    } : undefined,
    examples: study.examples?.map((example) => {
      const english = compileMarkedText(displayEnglishText(example.english));
      return {
        english,
        translationEs: example.translationEs,
        variantId: example.variantId,
        ttsText: example.ttsTextOverride ?? english.text,
      };
    }),
  };
}

export function essentialWordToStudyCard(entry: EssentialWord): StudyCardModel {
  return {
    word: displayEnglishWord(entry.word, { pos: entry.pos }),
    ipa: present(entry.ipa_strong),
    meaning: present(entry.meaning ? displayEnglishText(entry.meaning) : undefined),
    translation: present(entry.translation),
    sentence: present(entry.example_sentence ? displayEnglishText(entry.example_sentence) : undefined),
    sentenceIpa: present(entry.sentence_ipa),
    weakForm: hasReduction(entry)
      ? { ipa: entry.ipa_weak!, phrase: weakFormPhrase(entry.example_sentence, entry.word) }
      : undefined,
    chips: [`#${entry.rank} más frecuente`, essentialWordPosLabel(entry.pos)],
    levelBadge: entry.cefr_level,
    study: studyCardStudy(entry),
  };
}

export function wordBankEntryToStudyCard(entry: WordBankEntry): StudyCardModel {
  const essentialMetadata = (entry as EssentialMetadataEntry).essentialMetadata;

  return {
    word: entry.text,
    ipa: present(entry.ipa),
    meaning: present(entry.meaning),
    translation: present(entry.translation),
    sentence: present(entry.example),
    srsBadge: srsBadgeLabel(entry.srs_status),
    levelBadge: essentialMetadata?.cefr_level,
    chips: essentialMetadata
      ? [`#${essentialMetadata.rank} más frecuente`, essentialWordPosLabel(essentialMetadata.pos)]
      : undefined,
    // word_bank has no weak-form or sentence-IPA data.
  };
}
