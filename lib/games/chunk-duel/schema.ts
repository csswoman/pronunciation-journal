import { z } from 'zod'

export const chunkDuelItemSchema = z.object({
  id: z.string(),
  chunk: z.string(),
  meaning: z.string(),
  example: z.string(),
  category: z.string(),
})

export type ChunkDuelItem = z.infer<typeof chunkDuelItemSchema>
