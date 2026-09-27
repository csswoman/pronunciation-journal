import type { ChunkDuelItem } from './schema'

export type Tile = {
  id: string
  text: string
  isSolution: boolean
  solutionIndex?: number
}

export type RoundSpec = {
  chunkItem: ChunkDuelItem
  solutionTokens: string[]
  tiles: Tile[]
}

export function tokenizeChunk(chunkText: string): string[] {
  return chunkText.trim().split(/\s+/).filter(Boolean)
}

export function buildRound(
  chunkItem: ChunkDuelItem,
  pool: ChunkDuelItem[],
  rng: () => number = Math.random,
): RoundSpec {
  const solutionTokens = tokenizeChunk(chunkItem.chunk)

  const solutionTiles: Tile[] = solutionTokens.map((token, index) => ({
    id: `sol-${index}-${token}`,
    text: token,
    isSolution: true,
    solutionIndex: index,
  }))

  // Pick 1-2 distractor tokens from pool
  const otherChunks = pool.filter((c) => c.id !== chunkItem.id)
  const candidateDistractors: string[] = []

  for (const other of otherChunks) {
    const tokens = tokenizeChunk(other.chunk)
    for (const t of tokens) {
      const cleanT = t.toLowerCase().replace(/[^a-z']/g, '')
      const isAlreadyInSol = solutionTokens.some(
        (s) => s.toLowerCase().replace(/[^a-z']/g, '') === cleanT,
      )
      if (!isAlreadyInSol && cleanT.length >= 2) {
        candidateDistractors.push(t)
      }
    }
  }

  // Pick 2 unique distractors
  const chosenDistractors: string[] = []
  while (chosenDistractors.length < 2 && candidateDistractors.length > 0) {
    const idx = Math.floor(rng() * candidateDistractors.length)
    const picked = candidateDistractors.splice(idx, 1)[0]!
    if (!chosenDistractors.includes(picked)) {
      chosenDistractors.push(picked)
    }
  }

  const distractorTiles: Tile[] = chosenDistractors.map((dist, idx) => ({
    id: `dist-${idx}-${dist}`,
    text: dist,
    isSolution: false,
  }))

  // Shuffle all tiles deterministically using rng
  const allTiles = [...solutionTiles, ...distractorTiles]
  for (let i = allTiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = allTiles[i]!
    allTiles[i] = allTiles[j]!
    allTiles[j] = temp
  }

  return {
    chunkItem,
    solutionTokens,
    tiles: allTiles,
  }
}
