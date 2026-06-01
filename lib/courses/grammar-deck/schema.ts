// Zod schema for authored grammar study decks.
//
// Decks live as one JSON file per lesson slug under public/grammar-decks/ —
// outside the JS bundle — and are validated at runtime, mirroring the
// lib/content/lessons.ts convention.
//
// The card model here must stay in sync with the compile-time types in
// ./types.ts (GrammarStudyDeckData and friends).

import { z } from "zod";

const GrammarDeckMetaSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  titleEmphasis: z.string().optional(),
  /** CEFR-style can-do statement, e.g. "Ya puedes pedir comida en un restaurante." */
  goal: z.string().optional(),
});

const GrammarConjugationRowSchema = z.object({
  pronoun: z.string(),
  form: z.string(),
  hint: z.string().optional(),
});

const GrammarContrastColumnSchema = z.object({
  label: z.string(),
  rule: z.string(),
  examples: z.array(z.string()),
});

const GrammarPairLineSchema = z.object({
  variant: z.enum(["bad", "good"]),
  text: z.string(),
  note: z.string().optional(),
});

const GrammarRuleRowSchema = z.object({
  key: z.string(),
  value: z.string(),
  highlights: z.array(z.string()).optional(),
  hint: z.string().optional(),
});

const Cell = z.string();
const Row4 = z.tuple([Cell, Cell, Cell, Cell]);

const GrammarPronExampleSchema = z.object({
  /** The English phrase to hear and practice. */
  text: z.string(),
  /** Optional IPA transcription, shown muted. */
  ipa: z.string().optional(),
  /** Optional Spanish gloss / note. */
  es: z.string().optional(),
});

const GrammarCardBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("conjugation"), rows: z.array(GrammarConjugationRowSchema) }),
  z.object({ type: z.literal("verb-table"), headers: Row4, rows: z.array(Row4) }),
  z.object({ type: z.literal("contrast"), columns: z.array(GrammarContrastColumnSchema) }),
  z.object({ type: z.literal("pairs"), lines: z.array(GrammarPairLineSchema) }),
  z.object({ type: z.literal("rules"), rows: z.array(GrammarRuleRowSchema) }),
  z.object({
    type: z.literal("pronunciation"),
    /** Target sound label, e.g. "/θ/" or "Reducción: gonna". */
    sound: z.string(),
    /** IPA keys passed to the Sound Lab drill link (?focus=…). */
    focus: z.array(z.string()).optional(),
    examples: z.array(GrammarPronExampleSchema).min(1),
    note: z.string().optional(),
  }),
]);

const GrammarStudyCardSchema = z.object({
  id: z.string().min(1),
  // `index` is assigned by the loader from array position; optional in JSON.
  index: z.number().int().optional(),
  tag: z.string(),
  title: z.string(),
  titleItalic: z.array(z.string()).optional(),
  lede: z.string(),
  blocks: z.array(GrammarCardBlockSchema).min(1),
  tip: z.object({ label: z.string(), body: z.string() }).optional(),
});

const GrammarRelatedSchema = z.object({
  /** Target deck slug under public/grammar-decks/. */
  slug: z.string().min(1),
  label: z.string().min(1),
});

const GrammarQuizQuestionSchema = z.object({
  q: z.string().min(1),
  options: z.array(z.string()).min(2),
  /** 0-based index of the correct option. */
  answer: z.number().int().nonnegative(),
  explain: z.string().optional(),
});

/** A grammar deck file. `meta` is optional; the loader fills a default. */
export const GrammarStudyDeckSchema = z.object({
  meta: GrammarDeckMetaSchema.optional(),
  /** Target IPA sounds for the Sound Lab handoff (e.g. ["θ","ð","ə"]). */
  sounds: z.array(z.string()).optional(),
  /** Cross-links to sibling decks shown on completion. */
  related: z.array(GrammarRelatedSchema).optional(),
  /** Optional 1–5 question self-check shown before the done screen. */
  quiz: z.array(GrammarQuizQuestionSchema).max(5).optional(),
  // Exactly 6 cards per lesson — the "aprendizaje correcto" rule.
  cards: z.array(GrammarStudyCardSchema).length(6),
});

export type GrammarStudyDeckFile = z.infer<typeof GrammarStudyDeckSchema>;
