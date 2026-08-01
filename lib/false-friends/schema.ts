// Zod schema for the false-friends bank (public/false-friends/pairs-00N.json).
// Must stay in sync with the compile-time types in ./types.ts.

import { z } from "zod";
import { FALSE_FRIEND_KINDS } from "./types";

export const GAP_TOKEN = "___";

export const FalseFriendPromptSchema = z
  .object({
    sentence: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(4),
    answer: z.number().int().min(0),
    explain: z.string().min(1),
  })
  .refine((p) => p.sentence.includes(GAP_TOKEN), {
    message: `La frase debe contener el hueco ${GAP_TOKEN}`,
    path: ["sentence"],
  })
  .refine((p) => p.sentence.split(GAP_TOKEN).length === 2, {
    message: `La frase debe contener exactamente un hueco ${GAP_TOKEN}`,
    path: ["sentence"],
  })
  .refine((p) => p.answer < p.options.length, {
    message: "answer debe apuntar a una opción existente",
    path: ["answer"],
  })
  .refine(
    (p) => {
      const normalized = p.options.map((o) => o.trim().toLowerCase());
      return new Set(normalized).size === normalized.length;
    },
    { message: "Las opciones no pueden repetirse", path: ["options"] },
  );

export const FalseFriendSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, "id en kebab-case, p.ej. actually-currently"),
    word: z.string().min(1),
    looksLike: z.string().min(1),
    actualMeaning: z.string().min(1),
    correctWord: z.string().min(1),
    kind: z.enum(FALSE_FRIEND_KINDS),
    cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
    prompts: z.array(FalseFriendPromptSchema).min(1).max(3),
    note: z.string().min(1).optional(),
  })
  .refine((f) => f.word.trim().toLowerCase() !== f.correctWord.trim().toLowerCase(), {
    message: "word y correctWord no pueden ser la misma palabra",
    path: ["correctWord"],
  })
  .superRefine((f, ctx) => {
    // Every prompt must actually exercise the confusion: the trap word and the
    // right word both have to be on the table, or the choice teaches nothing.
    //
    // Matching is by containment, not equality, because a natural gap often
    // needs an inflected or phrasal option — "have a cold" for `correctWord`
    // "have a cold" in a sentence that already supplies the subject. Requiring
    // exact equality would force ungrammatical sentences.
    const trap = f.word.trim().toLowerCase();
    const right = f.correctWord.trim().toLowerCase();
    const mentions = (options: string[], term: string) =>
      options.some((o) => o.includes(term));

    f.prompts.forEach((prompt, index) => {
      const options = prompt.options.map((o) => o.trim().toLowerCase());
      if (!mentions(options, trap) || !mentions(options, right)) {
        ctx.addIssue({
          code: "custom",
          message: `prompt ${index + 1}: las opciones deben incluir "${f.word}" y "${f.correctWord}"`,
          path: ["prompts", index, "options"],
        });
      }
    });
  });

export const FalseFriendChunkSchema = z.object({
  version: z.literal(1),
  entries: z.array(FalseFriendSchema).nonempty(),
});
