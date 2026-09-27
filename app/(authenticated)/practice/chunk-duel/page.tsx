import PageLayout from '@/components/layout/PageLayout'
import ChunkDuelSession from '@/components/practice/chunk-duel/ChunkDuelSession'
import { LEARNING_CHUNKS } from '@/lib/chunk-of-day/catalog'
import type { ChunkDuelItem } from '@/lib/games/chunk-duel/schema'

export const metadata = {
  title: 'Chunk Duel | English Journal',
  description: 'Desafío de velocidad con bloques de lenguaje y colocaciones',
}

export default function ChunkDuelPage() {
  const pool: ChunkDuelItem[] = LEARNING_CHUNKS.map((c) => ({
    id: c.id,
    chunk: c.chunk,
    meaning: c.meaning,
    example: c.example,
    category: c.category,
  }))

  return (
    <PageLayout archetype="catalog">
      <ChunkDuelSession pool={pool} />
    </PageLayout>
  )
}
