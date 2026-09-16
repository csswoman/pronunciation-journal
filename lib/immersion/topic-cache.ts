import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import type { ImmersionTopicRelation } from './types'

export interface CachedRelevanceEntry {
  relevance: ImmersionTopicRelation
  confidence: number
  reason: string
  cachedAt: string
}

const CACHE_FILE = path.join(process.cwd(), '.cache', 'engvid-topic-relevance.json')

export function computeTopicCacheKey(videoIdOrUrl: string, topicSlug: string): string {
  return crypto
    .createHash('sha256')
    .update(`${videoIdOrUrl.trim()}:${topicSlug.trim()}`)
    .digest('hex')
}

export function loadRelevanceCache(): Record<string, CachedRelevanceEntry> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    }
  } catch {
    // Si la caché no existe o está corrupta, retornar vacío
  }
  return {}
}

export function saveRelevanceCache(cache: Record<string, CachedRelevanceEntry>): void {
  try {
    const dir = path.dirname(CACHE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
  } catch {
    // Fallo de escritura no debe bloquear el flujo
  }
}
