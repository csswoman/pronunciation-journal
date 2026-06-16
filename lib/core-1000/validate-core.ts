// Content-quality validation for Core 1000 entries. Pure logic — runs in
// Vitest (npm run validate:core1000). IPA mismatches against CMUdict are a
// SIGNAL for manual review, silenced explicitly via
// scripts/core-1000/data/ipa-exceptions.json, never auto-accepted.

import { lookupIpaFromCmu } from "@/lib/lexicon/ipa";
import { WEAK_FORM_WHITELIST } from "./weak-forms";
import type { CoreWord } from "./types";

export type IssueKind = "ipa-mismatch" | "weak-not-whitelisted" | "sentence-missing-word";

export interface ValidationIssue {
  rank: number;
  word: string;
  kind: IssueKind;
  detail: string;
}

/**
 * Normalization for comparing authored IPA against CMU-derived IPA.
 * CMU (via ARPABET_TO_IPA) carries no stress and writes ʌ for every AH, so we
 * erase stress marks and merge ʌ/ə, r/ɹ, g/ɡ on BOTH sides. This loses real
 * contrasts on purpose: the comparison is a review signal, not a proof.
 */
export function normalizeIpaForCompare(ipa: string): string {
  return ipa
    .replace(/[/[\]ˈˌ.\s]/g, "")
    .replace(/r/g, "ɹ")
    .replace(/ɡ/g, "g")
    .replace(/ʌ/g, "ə");
}

const IRREGULAR_FORMS: Readonly<Record<string, readonly string[]>> = {
  be: ["am", "is", "are", "was", "were", "been", "being"],
};

const INFLECTION_SUFFIXES =
  /^(?:s|es|ed|d|ing|er|est|ies|ied|ying|ier|iest|ers|ors|ists|ments|ness|tion|sions?|able|ible|ful|less|ous|ive|al|ity|ance|ence|ship|dom|ward|wards|ly)$/;

function escapeWordRegex(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesInflection(token: string, lemma: string): boolean {
  if (token.startsWith(lemma) && token.length > lemma.length) {
    if (INFLECTION_SUFFIXES.test(token.slice(lemma.length))) return true;
  }

  if (lemma.endsWith("e") && token.startsWith(lemma.slice(0, -1))) {
    const rest = token.slice(lemma.length - 1);
    if (/^(?:d|ds|ing|ed|er|est|s|rs?)$/.test(rest)) return true;
  }

  if (lemma.length >= 3 && token.startsWith(lemma.slice(0, -1))) {
    const doubled = lemma.slice(-1);
    if (token.startsWith(lemma.slice(0, -1) + doubled)) {
      return INFLECTION_SUFFIXES.test(token.slice(lemma.length));
    }
  }

  if (lemma.endsWith("y") && token.startsWith(lemma.slice(0, -1))) {
    return /^(?:ies|ied|ying|ier|iest|y)$/.test(token.slice(lemma.length - 1));
  }

  return false;
}

/** True when the sentence uses the lemma or a common inflected/compound surface form. */
export function sentenceContainsWord(sentence: string, word: string): boolean {
  const lemma = word.toLowerCase();
  const escaped = escapeWordRegex(word);

  if (new RegExp(`\\b${escaped}\\b`, "i").test(sentence)) return true;

  const irregulars = IRREGULAR_FORMS[lemma];
  if (irregulars?.some((form) => new RegExp(`\\b${escapeWordRegex(form)}\\b`, "i").test(sentence))) {
    return true;
  }

  const tokens = sentence.match(/\b[\w'-]+\b/g) ?? [];
  for (const raw of tokens) {
    const token = raw.toLowerCase().replace(/'/g, "");
    if (token === lemma) return true;
    if (matchesInflection(token, lemma)) return true;

    if (lemma.length >= 4 && token !== lemma && (token.startsWith(lemma) || token.endsWith(lemma))) {
      return true;
    }
  }

  return false;
}

export function validateEntry(entry: CoreWord): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { rank, word } = entry;

  const cmuIpa = lookupIpaFromCmu(word);
  if (cmuIpa && normalizeIpaForCompare(cmuIpa) !== normalizeIpaForCompare(entry.ipa_strong)) {
    issues.push({
      rank, word, kind: "ipa-mismatch",
      detail: `ipa_strong=${entry.ipa_strong} vs CMU=${cmuIpa}`,
    });
  }

  if (entry.ipa_weak && !WEAK_FORM_WHITELIST.has(word.toLowerCase())) {
    issues.push({
      rank, word, kind: "weak-not-whitelisted",
      detail: `ipa_weak=${entry.ipa_weak} pero "${word}" no está en la whitelist`,
    });
  }

  if (!sentenceContainsWord(entry.example_sentence, word)) {
    issues.push({
      rank, word, kind: "sentence-missing-word",
      detail: `"${entry.example_sentence}" no contiene "${word}"`,
    });
  }

  return issues;
}
