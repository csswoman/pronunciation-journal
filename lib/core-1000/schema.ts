// Zod schema for Core 1000 chunks (public/core-1000/words-00N.json).
// Must stay in sync with the compile-time types in ./types.ts.

import { z } from "zod";
import { CORE_POS } from "./types";

export const CoreWordSchema = z
  .object({
    rank: z.number().int().min(1).max(2800),
    word: z.string().min(1),
    pos: z.enum(CORE_POS),
    ipa_strong: z.string().regex(/^\/.+\/$/, "IPA entre slashes, p.ej. /tuː/"),
    ipa_weak: z.string().regex(/^\/.+\/$/).optional(),
    example_sentence: z.string().min(1),
    sentence_ipa: z.string().regex(/^\/.+\/$/).optional(),
    cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  })
  .refine((w) => !w.ipa_weak || !!w.sentence_ipa, {
    message: "sentence_ipa es obligatorio cuando hay ipa_weak",
    path: ["sentence_ipa"],
  });

export const CoreChunkSchema = z.object({
  version: z.literal(1),
  entries: z.array(CoreWordSchema).nonempty(),
});
