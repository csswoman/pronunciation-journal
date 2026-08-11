// Zod schema for Essential Words chunks (public/essential-words/words-00N.json).
// Must stay in sync with the compile-time types in ./types.ts.

import { z } from "zod";
import { ESSENTIAL_WORD_POS, STUDY_CONTRAST_PATTERNS } from "./types";

export const SentenceTokenSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().positive(),
  text: z.string().min(1),
  normalized: z.string().min(1),
  ipa: z.string().regex(/^\/.+\/$/, "IPA entre slashes"),
  role: z.enum(["content", "function"]),
  contrastIds: z.array(z.string().min(3)),
}).refine((token) => token.end > token.start, { message: "offset inválido" });

export const SentenceVariantSchema = z.object({
  sentence: z.string().min(1),
  sentence_ipa: z.string().regex(/^\/.+\/$/, "IPA entre slashes"),
  tokens: z.array(SentenceTokenSchema).min(1).optional(),
});

const StudySoundAnchorSchema = z.object({
  id: z.string().min(1),
  ipa: z.string().regex(/^\/.+\/$/, "IPA entre slashes"),
  explanationEs: z.string().min(1),
});

const StudyPronunciationVariantSchema = z.object({
  id: z.string().min(1),
  labelEs: z.string().min(1),
  ipa: z.string().regex(/^\/.+\/$/, "IPA entre slashes"),
  spokenExample: z.string().min(1),
  ttsTextOverride: z.string().min(1).optional(),
  anchorIds: z.array(z.string().min(1)),
});

const StudyExampleSchema = z.object({
  english: z.string().min(1),
  translationEs: z.string().min(1),
  variantId: z.string().min(1).optional(),
  ttsTextOverride: z.string().min(1).optional(),
});

const StudyContrastPairSchema = z.object({
  pattern: z.enum(STUDY_CONTRAST_PATTERNS),
  spanish: z.string().min(1),
  english: z.string().min(1),
  explanationEs: z.string().min(1).optional(),
  ttsTextOverride: z.string().min(1).optional(),
});

export const EssentialWordStudySchema = z.object({
  definitionEs: z.string().min(1).optional(),
  translation: z.array(z.string().min(1)).min(1).optional(),
  translationNote: z.string().min(1).optional(),
  spellingVariants: z.array(z.object({
    spelling: z.string().min(1),
    localeEs: z.string().min(1),
  })).min(1).optional(),
  usage: z.object({
    ruleId: z.string().min(1).optional(),
    ruleEsOverride: z.string().min(1).optional(),
  }).refine((usage) => !!usage.ruleId || !!usage.ruleEsOverride, {
    message: "usage requiere ruleId o ruleEsOverride",
  }).optional(),
  pronunciation: z.object({
    soundAnchors: z.array(StudySoundAnchorSchema).optional(),
    variants: z.array(StudyPronunciationVariantSchema).optional(),
  }).optional(),
  contrasts: z.object({
    titleEs: z.string().min(1),
    pairs: z.array(StudyContrastPairSchema).min(1),
  }).optional(),
  examples: z.array(StudyExampleSchema).min(1).optional(),
});

export const EssentialWordSchema = z
  .object({
    rank: z.number().int().min(1).max(2800),
    word: z.string().min(1),
    pos: z.enum(ESSENTIAL_WORD_POS),
    ipa_strong: z.string().regex(/^\/.+\/$/, "IPA entre slashes, p.ej. /tuː/"),
    ipa_weak: z.string().regex(/^\/.+\/$/).optional(),
    example_sentence: z.string().min(1),
    sentence_ipa: z.string().regex(/^\/.+\/$/).optional(),
    example_tokens: z.array(SentenceTokenSchema).min(1).optional(),
    cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
    meaning: z.string().min(1).optional(),
    translation: z.string().min(1).optional(),
    example_sentences: z.array(SentenceVariantSchema).nonempty().optional(),
    study: EssentialWordStudySchema.optional(),
    teachWith: z.array(z.string().min(1)).optional(),
  })
  .refine((w) => !w.ipa_weak || !!w.sentence_ipa, {
    message: "sentence_ipa es obligatorio cuando hay ipa_weak",
    path: ["sentence_ipa"],
  });

export const EssentialWordChunkSchema = z.object({
  version: z.literal(1),
  entries: z.array(EssentialWordSchema).nonempty(),
});
