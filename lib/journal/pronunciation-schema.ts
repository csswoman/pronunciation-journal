import { z } from 'zod'

export const journalPronunciationResponseSchema = z.object({
  wordOrPhrase: z.string().optional(),
  ipa: z.string(),
  syllableStress: z.string(),
  suggestedReason: z.enum([
    'difficult_sound',
    'syllable_stress',
    'tricky_spelling',
    'new_word',
    'other',
  ]),
  explanationEs: z.string(),
  phoneticTrap: z.string().optional(),
})
