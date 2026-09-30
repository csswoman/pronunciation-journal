import { z } from 'zod'

export const memoryWordSchema = z.object({
  id: z.string(),
  word: z.string(),
  meaningEs: z.string(),
  ipa: z.string(),
})

export type MemoryWordItem = z.infer<typeof memoryWordSchema>
