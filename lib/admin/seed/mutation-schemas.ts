import { z } from "zod";

const SoundPayloadSchema = z
  .object({
    ipa: z.string().min(1).max(20),
    type: z.enum(["vowel", "consonant", "diphthong"]),
    category: z.string().max(50).nullable(),
    example: z.string().max(100).nullable(),
    difficulty: z.number().int().min(0).max(5).nullable(),
  })
  .strict();

const WordPayloadSchema = z
  .object({
    word: z.string().min(1).max(100),
    ipa: z.string().max(50).nullable(),
    sound_id: z.number().int().nullable(),
    sound_focus: z.string().max(50).nullable(),
    difficulty: z.number().int().min(0).max(5).nullable(),
    audio_url: z.string().max(500).nullable(),
  })
  .strict();

const PatternPayloadSchema = z
  .object({
    pattern: z.string().min(1).max(100),
    type: z.string().max(50).nullable(),
    sound_focus: z.string().max(50).nullable(),
  })
  .strict();

const PatternWordPayloadSchema = z
  .object({
    pattern_id: z.number().int(),
    word: z.string().min(1).max(100),
    ipa: z.string().max(50).nullable(),
  })
  .strict();

const MinimalPairPayloadSchema = z
  .object({
    word_a: z.string().min(1).max(100),
    word_b: z.string().min(1).max(100),
    ipa_a: z.string().max(50).nullable(),
    ipa_b: z.string().max(50).nullable(),
    sound_group: z.string().max(50).nullable(),
    sound_a_id: z.number().int().nullable(),
    sound_b_id: z.number().int().nullable(),
    contrast_sound_a_id: z.number().int().nullable(),
    contrast_sound_b_id: z.number().int().nullable(),
    contrast_ipa_a: z.string().max(50).nullable(),
    contrast_ipa_b: z.string().max(50).nullable(),
  })
  .strict();

export const AdminSeedBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("insertSound"), payload: SoundPayloadSchema }).strict(),
  z.object({ action: z.literal("insertWord"), payload: WordPayloadSchema }).strict(),
  z.object({ action: z.literal("insertPattern"), payload: PatternPayloadSchema }).strict(),
  z.object({ action: z.literal("insertPatternWord"), payload: PatternWordPayloadSchema }).strict(),
  z.object({ action: z.literal("insertMinimalPair"), payload: MinimalPairPayloadSchema }).strict(),
]);

export type AdminSeedBody = z.infer<typeof AdminSeedBodySchema>;

export const ADMIN_SEED_TABLE_MAP = {
  insertSound: "sounds",
  insertWord: "words",
  insertPattern: "patterns",
  insertPatternWord: "pattern_words",
  insertMinimalPair: "minimal_pairs",
} as const satisfies Record<AdminSeedBody["action"], string>;
