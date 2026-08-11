// Content-quality validation for Core 1000 entries. Pure logic — runs in
// Vitest (npm run validate:essential-words). IPA mismatches against CMUdict are a
// SIGNAL for manual review, silenced explicitly via
// scripts/essential-words/data/ipa-exceptions.json, never auto-accepted.

import { sentenceContainsLemma } from "@/lib/exercises/eligibility";
import { lookupIpaFromCmu } from "@/lib/lexicon/ipa";
import { WEAK_FORM_WHITELIST } from "./weak-forms";
import type { EssentialWord } from "./types";
import { compileMarkedText, StudyMarkupError } from "./study-markup";
import { STUDY_RULES } from "./study-rules";

export type IssueKind =
  | "ipa-mismatch"
  | "weak-not-whitelisted"
  | "sentence-missing-word"
  | "variant-missing-word"
  | "variant-duplicate"
  | "study-markup"
  | "study-unknown-variant"
  | "study-unknown-anchor"
  | "study-missing-variant-example"
  | "study-missing-examples"
  | "study-missing-explanation"
  | "study-unknown-rule";

export interface ValidationIssue {
  rank: number;
  word: string;
  kind: IssueKind;
  detail: string;
}

/**
 * Normalization for comparing authored IPA against CMU-derived IPA.
 * CMU may include lexical stress (ˈ/ˌ) and AH0→ə; we erase stress marks and
 * merge ʌ/ə, r/ɹ, g/ɡ on BOTH sides. This loses real contrasts on purpose:
 * the comparison is a review signal, not a proof.
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

export function validateEntry(entry: EssentialWord): ValidationIssue[] {
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

  const seen = new Set([entry.example_sentence.trim().toLowerCase()]);
  for (const [i, variant] of (entry.example_sentences ?? []).entries()) {
    const text = variant.sentence.trim();
    if (!sentenceContainsLemma(text, word)) {
      issues.push({
        rank, word, kind: "variant-missing-word",
        detail: `variante ${i + 1}: "${text}" no contiene "${word}"`,
      });
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      issues.push({
        rank, word, kind: "variant-duplicate",
        detail: `variante ${i + 1} repite una oración ya presente: "${text}"`,
      });
    }
    seen.add(key);
  }

  const study = entry.study;
  if (!study) return issues;

  if (study.usage?.ruleId && !(study.usage.ruleId in STUDY_RULES)) {
    issues.push({
      rank,
      word,
      kind: "study-unknown-rule",
      detail: `usage.ruleId inexistente: "${study.usage.ruleId}"`,
    });
  }

  const validateMarkup = (path: string, text: string) => {
    try {
      compileMarkedText(text);
    } catch (error) {
      const detail = error instanceof StudyMarkupError ? error.message : String(error);
      issues.push({ rank, word, kind: "study-markup", detail: `${path}: ${detail}` });
    }
  };

  const anchors = new Set(study.pronunciation?.soundAnchors?.map((anchor) => anchor.id) ?? []);
  const variants = new Set(study.pronunciation?.variants?.map((variant) => variant.id) ?? []);
  const referencedVariants = new Set<string>();

  for (const [i, variant] of (study.pronunciation?.variants ?? []).entries()) {
    validateMarkup(`pronunciation.variants[${i}].spokenExample`, variant.spokenExample);
    for (const anchorId of variant.anchorIds) {
      if (!anchors.has(anchorId)) {
        issues.push({
          rank,
          word,
          kind: "study-unknown-anchor",
          detail: `pronunciation.variants[${i}] referencia anchorId inexistente: "${anchorId}"`,
        });
      }
    }
  }

  for (const [i, example] of (study.examples ?? []).entries()) {
    validateMarkup(`examples[${i}].english`, example.english);
    if (example.variantId) {
      referencedVariants.add(example.variantId);
      if (!variants.has(example.variantId)) {
        issues.push({
          rank,
          word,
          kind: "study-unknown-variant",
          detail: `examples[${i}] referencia variantId inexistente: "${example.variantId}"`,
        });
      }
    }
  }

  if (variants.size > 0 && !study.examples?.length) {
    issues.push({ rank, word, kind: "study-missing-examples", detail: "Hay variantes de pronunciación sin ejemplos." });
  }
  for (const variantId of variants) {
    if (!referencedVariants.has(variantId)) {
      issues.push({
        rank,
        word,
        kind: "study-missing-variant-example",
        detail: `La variante "${variantId}" no tiene ningún ejemplo asociado.`,
      });
    }
  }

  for (const [i, pair] of (study.contrasts?.pairs ?? []).entries()) {
    validateMarkup(`contrasts.pairs[${i}].spanish`, pair.spanish);
    validateMarkup(`contrasts.pairs[${i}].english`, pair.english);
    if ((pair.pattern === "replacement" || pair.pattern === "false_friend") && !pair.explanationEs) {
      issues.push({
        rank,
        word,
        kind: "study-missing-explanation",
        detail: `contrasts.pairs[${i}] (${pair.pattern}) requiere explanationEs.`,
      });
    }
  }

  return issues;
}
