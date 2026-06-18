// Content-quality validation for Core 1000 entries. Pure logic — runs in
// Vitest (npm run validate:core1000). IPA mismatches against CMUdict are a
// SIGNAL for manual review, silenced explicitly via
// scripts/core-1000/data/ipa-exceptions.json, never auto-accepted.

import { sentenceContainsLemma } from "@/lib/exercises/eligibility";
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

/** @deprecated Import from `@/lib/exercises/eligibility` — re-export for legacy importers. */
export { sentenceContainsLemma as sentenceContainsWord } from "@/lib/exercises/eligibility";

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

  if (!sentenceContainsLemma(entry.example_sentence, word)) {
    issues.push({
      rank, word, kind: "sentence-missing-word",
      detail: `"${entry.example_sentence}" no contiene "${word}"`,
    });
  }

  return issues;
}
