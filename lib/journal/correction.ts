import { z } from 'zod'

/** Request body for POST /api/gemini/journal-correct. */
export const journalCorrectRequestSchema = z
  .object({ entryId: z.string().uuid(), content: z.string().min(1).max(4000) })
  .strict()

export type JournalCorrectRequest = z.infer<typeof journalCorrectRequestSchema>

/** A single correction the AI made on the learner's entry. */
export const journalErrorSchema = z
  .object({
    quote: z.string().max(300),
    correction: z.string().max(300),
    type: z.string().max(80),
    explanationEs: z.string().max(500),
    topic: z.string().max(120),
  })
  .strict()

export type JournalError = z.infer<typeof journalErrorSchema>

/** Validated Gemini response for a journal correction. */
export const journalCorrectionResultSchema = z
  .object({
    correctedContent: z.string().min(1).max(6000),
    errors: z.array(journalErrorSchema).max(8),
    newWords: z.array(z.string().max(80)).max(8),
  })
  .strict()

export type JournalCorrectionResult = z.infer<typeof journalCorrectionResultSchema>

/** Feedback payload persisted on the journal entry (mirrors what the UI reads). */
export interface JournalFeedback {
  errors: JournalError[]
  newWords: string[]
}
