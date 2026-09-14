import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CHUNKS_OF_THE_DAY } from '@/lib/chunk-of-day/data'
import contentGraphRows from '@/lib/chunk-of-day/content-graph.json'
import { validateChunkContentGraph } from '@/lib/chunk-of-day/content-graph'
import type { ChunkContentGraphEntry } from '@/lib/chunk-of-day/types'

type CatalogIndex = { entries: [number, string][] }

async function main() {
  const catalogPath = resolve('public/essential-words/catalog-index.json')
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8')) as CatalogIndex
  const knownEssentialWordIds = new Set(catalog.entries.map((entry) => `c1k:${entry[1].toLowerCase()}`))
  const issues = validateChunkContentGraph(CHUNKS_OF_THE_DAY, contentGraphRows as ChunkContentGraphEntry[], {
    knownEssentialWordIds,
  })

  if (issues.length > 0) {
    for (const issue of issues) console.error(`${issue.chunkId}: ${issue.code}: ${issue.detail}`)
    process.exitCode = 1
    return
  }
  console.log(`Validated ${contentGraphRows.length} chunk content graph entries.`)
}

void main()
