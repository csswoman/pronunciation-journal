import metadataRows from './learning-metadata.json'
import contentGraphRows from './content-graph.json'
import { CHUNKS_OF_THE_DAY } from './data'
import { resolveChunkContentGraph, validateChunkContentGraph } from './content-graph'
import type { ChunkLearningMetadata, LearningChunk } from './types'

type MetadataRow = { id: string; learning: ChunkLearningMetadata }
type ContentGraphRow = import('./types').ChunkContentGraphEntry

const metadataById = new Map(
  (metadataRows as MetadataRow[]).map((row) => [row.id, row.learning]),
)

const contentGraph = contentGraphRows as ContentGraphRow[]
const contentGraphIssues = validateChunkContentGraph(CHUNKS_OF_THE_DAY, contentGraph)
if (contentGraphIssues.length > 0) {
  throw new Error(`Invalid chunk content graph: ${contentGraphIssues.map((issue) => `${issue.chunkId}:${issue.code}`).join(', ')}`)
}
const contentGraphByChunkId = new Map(contentGraph.map((entry) => [entry.chunkId, entry]))

export const LEARNING_CHUNKS: LearningChunk[] = CHUNKS_OF_THE_DAY.map((chunk) => {
  const learning = metadataById.get(chunk.id)
  if (!learning) throw new Error(`Missing learning metadata for chunk ${chunk.id}`)
  return { ...chunk, learning, contentGraph: resolveChunkContentGraph(chunk, contentGraphByChunkId.get(chunk.id)) }
})

export function getLearningChunk(id: string): LearningChunk | undefined {
  return LEARNING_CHUNKS.find((chunk) => chunk.id === id)
}
