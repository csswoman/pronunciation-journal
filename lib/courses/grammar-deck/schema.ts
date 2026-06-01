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

const GrammarCardBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("conjugation"), rows: z.array(GrammarConjugationRowSchema) }),
  z.object({ type: z.literal("verb-table"), headers: Row4, rows: z.array(Row4) }),
  z.object({ type: z.literal("contrast"), columns: z.array(GrammarContrastColumnSchema) }),
  z.object({ type: z.literal("pairs"), lines: z.array(GrammarPairLineSchema) }),
  z.object({ type: z.literal("rules"), rows: z.array(GrammarRuleRowSchema) }),
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

/** A grammar deck file. `meta` is optional; the loader fills a default. */
export const GrammarStudyDeckSchema = z.object({
  meta: GrammarDeckMetaSchema.optional(),
  // Exactly 6 cards per lesson — the "aprendizaje correcto" rule.
  cards: z.array(GrammarStudyCardSchema).length(6),
});

export type GrammarStudyDeckFile = z.infer<typeof GrammarStudyDeckSchema>;
