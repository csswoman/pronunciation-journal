import metadataRows from './learning-metadata.json'
import techMetadataRows from './learning-metadata-tech.json'
import contentGraphRows from './content-graph.json'
import { CHUNKS_OF_THE_DAY } from './data'
import { TECH_CHUNKS } from './data-tech'
import { resolveChunkContentGraph, validateChunkContentGraph } from './content-graph'
import type { ChunkItem, ChunkLearningMetadata, LearningChunk } from './types'

type MetadataRow = { id: string; learning: ChunkLearningMetadata }
type ContentGraphRow = import('./types').ChunkContentGraphEntry

// The tech track (lib/chunk-of-day/data-tech.ts) ships as its own file so the
// 7000+ line general catalog stays reviewable; it merges into the same
// runtime catalog and is filtered back out by interest at selection time —
// see filterChunksForInterests in queries.ts.
const ALL_CHUNKS: ChunkItem[] = [...CHUNKS_OF_THE_DAY, ...TECH_CHUNKS]

const metadataById = new Map(
  [...(metadataRows as MetadataRow[]), ...(techMetadataRows as MetadataRow[])]
    .map((row) => [row.id, row.learning]),
)

const contentGraph = contentGraphRows as ContentGraphRow[]
const contentGraphIssues = validateChunkContentGraph(CHUNKS_OF_THE_DAY, contentGraph)
if (contentGraphIssues.length > 0) {
  throw new Error(`Invalid chunk content graph: ${contentGraphIssues.map((issue) => `${issue.chunkId}:${issue.code}`).join(', ')}`)
}
const contentGraphByChunkId = new Map(contentGraph.map((entry) => [entry.chunkId, entry]))

export const LEARNING_CHUNKS: LearningChunk[] = ALL_CHUNKS.map((chunk) => {
  const learning = metadataById.get(chunk.id)
  if (!learning) throw new Error(`Missing learning metadata for chunk ${chunk.id}`)
  return { ...chunk, learning, contentGraph: resolveChunkContentGraph(chunk, contentGraphByChunkId.get(chunk.id)) }
})

export function getLearningChunk(id: string): LearningChunk | undefined {
  return LEARNING_CHUNKS.find((chunk) => chunk.id === id)
}
