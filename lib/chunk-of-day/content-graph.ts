import { compileMarkedText } from '@/lib/essential-words/study-markup'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import type {
  ChunkContentGraphEntry,
  ChunkItem,
  ResolvedChunkContentGraph,
} from './types'

const ESSENTIAL_WORD_ID = /^c1k:[a-z][a-z'-]*$/
const WORD_BANK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ChunkContentGraphValidationOptions {
  knownEssentialWordIds?: ReadonlySet<string>
}

export interface ChunkContentGraphIssue {
  chunkId: string
  code: string
  detail: string
}

const EMPTY_CONTENT_GRAPH: ResolvedChunkContentGraph = {
  text: '',
  highlights: [],
  anchors: [],
  pronunciationTargetIds: [],
}

function validateAnchorId(owner: string, id: string): string | null {
  if (owner === 'essential_words') return ESSENTIAL_WORD_ID.test(id) ? null : 'must use a c1k:<word> id'
  if (owner === 'word_bank') return WORD_BANK_ID.test(id) ? null : 'must use a real word_bank UUID'
  return 'has an unsupported owner'
}

/** Validates author-authored relations before they reach selection or UI. */
export function validateChunkContentGraph(
  chunks: readonly ChunkItem[],
  entries: readonly ChunkContentGraphEntry[],
  options: ChunkContentGraphValidationOptions = {},
): ChunkContentGraphIssue[] {
  const issues: ChunkContentGraphIssue[] = []
  const chunkById = new Map(chunks.map((chunk) => [chunk.id, chunk]))
  const seen = new Set<string>()

  for (const entry of entries) {
    const chunk = chunkById.get(entry.chunkId)
    if (!chunk) {
      issues.push({ chunkId: entry.chunkId, code: 'unknown_chunk', detail: 'does not exist in the canonical catalog' })
      continue
    }
    if (seen.has(entry.chunkId)) {
      issues.push({ chunkId: entry.chunkId, code: 'duplicate_chunk', detail: 'has more than one content graph entry' })
      continue
    }
    seen.add(entry.chunkId)

    let compiled: ReturnType<typeof compileMarkedText>
    try {
      compiled = compileMarkedText(entry.markedText)
    } catch (error) {
      issues.push({ chunkId: entry.chunkId, code: 'invalid_markup', detail: error instanceof Error ? error.message : 'cannot compile marked text' })
      continue
    }
    if (compiled.text !== chunk.chunk) {
      issues.push({ chunkId: entry.chunkId, code: 'text_mismatch', detail: 'compiled marked text must equal the visible chunk' })
    }
    if (compiled.highlights.length === 0) {
      issues.push({ chunkId: entry.chunkId, code: 'missing_highlight', detail: 'must mark at least one anchor with ** **' })
    }
    if (compiled.highlights.length !== entry.anchors.length) {
      issues.push({ chunkId: entry.chunkId, code: 'anchor_count_mismatch', detail: 'each marked range needs exactly one stable anchor' })
    }

    for (const anchor of entry.anchors) {
      const anchorError = validateAnchorId(anchor.owner, anchor.id)
      if (anchorError) issues.push({ chunkId: entry.chunkId, code: 'invalid_anchor', detail: `${anchor.id} ${anchorError}` })
      if (anchor.owner === 'essential_words' && options.knownEssentialWordIds && !options.knownEssentialWordIds.has(anchor.id)) {
        issues.push({ chunkId: entry.chunkId, code: 'unknown_essential_word', detail: `${anchor.id} is absent from the Essential Words catalog` })
      }
    }

    for (const targetId of entry.pronunciationTargetIds ?? []) {
      const target = getTarget(targetId)
      if (!target.ok) issues.push({ chunkId: entry.chunkId, code: 'unknown_pronunciation_target', detail: `${targetId} is not a registered pronunciation target` })
    }
  }
  return issues
}

export function resolveChunkContentGraph(
  chunk: ChunkItem,
  entry: ChunkContentGraphEntry | undefined,
): ResolvedChunkContentGraph {
  if (!entry) return { ...EMPTY_CONTENT_GRAPH, text: chunk.chunk }
  const compiled = compileMarkedText(entry.markedText)
  return {
    text: compiled.text,
    highlights: compiled.highlights,
    anchors: entry.anchors,
    pronunciationTargetIds: entry.pronunciationTargetIds ?? [],
  }
}
