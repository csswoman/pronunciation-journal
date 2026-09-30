import { z } from 'zod'

export const weakFormPhraseSchema = z.object({
  id: z.string(),
  reduced: z.string(),
  full: z.string(),
  accept: z.array(z.string()).optional(),
  ipa: z.string(),
  ruleEs: z.string(),
  cefr: z.enum(['A1', 'A2', 'B1', 'B2']).optional(),
})

export type WeakFormPhraseItem = z.infer<typeof weakFormPhraseSchema>

export const weakFormPhrasesDataSchema = z.array(weakFormPhraseSchema)
