import { z } from 'zod'

export const journalNudgeCefrSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
export type JournalNudgeCefr = z.infer<typeof journalNudgeCefrSchema>

/** Request body for POST /api/gemini/journal-nudge. */
export const journalNudgeRequestSchema = z
  .object({
    prompt: z.string().min(1).max(500),
    partial_text: z.string().max(4000),
    cefr_level: journalNudgeCefrSchema,
    unused_seed_words: z.array(z.string().min(1).max(80)).max(6),
    target_length: z.number().int().positive().max(1000),
  })
  .strict()

export type JournalNudgeRequest = z.infer<typeof journalNudgeRequestSchema>

export const journalNudgeSchema = z
  .object({
    en: z.string().min(1).max(400),
    es: z.string().min(1).max(400),
  })
  .strict()

export const journalNudgeResponseSchema = z
  .object({ nudges: z.array(journalNudgeSchema).length(3) })
  .strict()

export type JournalNudge = z.infer<typeof journalNudgeSchema>
export type JournalNudgeResponse = z.infer<typeof journalNudgeResponseSchema>
