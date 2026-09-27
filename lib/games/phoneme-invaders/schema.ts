import { z } from 'zod'

export const minimalPairSchema = z.object({
  id: z.string(),
  wordA: z.string(),
  wordB: z.string(),
  ipaA: z.string(),
  ipaB: z.string(),
  contrast: z.string(),
})

export type MinimalPairItem = z.infer<typeof minimalPairSchema>

export const minimalPairsDataSchema = z.array(minimalPairSchema)
