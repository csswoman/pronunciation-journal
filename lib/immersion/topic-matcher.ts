import {
  fetchLessonHtml,
  normalizeLevel,
  parseLessonPage,
  type ArchivePost,
} from './scrape'
import type {
  ImmersionLevel,
  ImmersionTopicRelation,
} from './types'
import { classifyTopicRelevance } from '../gemini/immersion-topic-relevance'
import {
  computeTopicCacheKey,
  loadRelevanceCache,
  saveRelevanceCache,
  type CachedRelevanceEntry,
} from './topic-cache'

export {
  computeTopicCacheKey,
  loadRelevanceCache,
  saveRelevanceCache,
  type CachedRelevanceEntry,
}

import {
  type CanonicalTopic,
  cefrToEngVidLevel,
  SPANISH_TO_ENGLISH_GRAMMAR,
  extractEnglishSearchTerms,
  buildCanonicalTopic,
  findCanonicalTopic,
} from './canonical-topic'

export {
  type CanonicalTopic,
  cefrToEngVidLevel,
  SPANISH_TO_ENGLISH_GRAMMAR,
  extractEnglishSearchTerms,
  buildCanonicalTopic,
  findCanonicalTopic,
}

export interface CandidateEvaluation {
  url: string
  slug: string
  title: string
  level: ImmersionLevel
  youtubeVideoId: string
  relevance: ImmersionTopicRelation
  reason: string
  confidence: number
  assignmentType: 'direct' | 'fallback'
}

const RELEVANCE_RANK: Record<ImmersionTopicRelation, number> = {
  exact: 1,
  related: 2,
  complementary: 3,
  needs_review: 4,
  irrelevant: 5,
}

export function sortCandidatesByRelevance(
  candidates: CandidateEvaluation[],
): CandidateEvaluation[] {
  return [...candidates].sort((a, b) => {
    const rankA = RELEVANCE_RANK[a.relevance] ?? 99
    const rankB = RELEVANCE_RANK[b.relevance] ?? 99
    if (rankA !== rankB) return rankA - rankB
    return b.confidence - a.confidence
  })
}

export async function searchArchiveByQuery(options: {
  query: string
  level?: ImmersionLevel
  perPage?: number
}): Promise<ArchivePost[]> {
  const { query, level, perPage = 20 } = options
  const LEVEL_IDS: Record<ImmersionLevel, number> = { A2: 8, B1: 9, C1: 10 }
  const cat = level ? `&categories=${LEVEL_IDS[level]}` : ''
  const url = `https://www.engvid.com/wp-json/wp/v2/posts?per_page=${perPage}&page=1&_fields=slug,link&search=${encodeURIComponent(query)}${cat}`

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return []
    const json = await res.json()
    if (!Array.isArray(json)) return []
    return json.flatMap((item) =>
      typeof item?.slug === 'string' && typeof item?.link === 'string'
        ? [{ slug: item.slug, link: item.link }]
        : [],
    )
  } catch {
    return []
  }
}

export function applyBalancedFallback(
  directCandidates: CandidateEvaluation[],
  fallbackUrls: string[],
  limit: number,
): CandidateEvaluation[] {
  const result = [...directCandidates]
  for (const url of fallbackUrls) {
    if (result.length >= limit) break
    const slug = url.replace(/\/+$/, '').split('/').pop() || 'fallback'
    result.push({
      url,
      slug,
      title: `Fallback lesson: ${slug}`,
      level: 'B1',
      youtubeVideoId: '',
      relevance: 'related', // Hard rule: Nunca 'exact'
      reason: 'Asignación complementaria mediante fallback balanceado.',
      confidence: 0.7,
      assignmentType: 'fallback',
    })
  }
  return result
}

export interface CollectTopicOptions {
  topic: string
  limit: number
  apiKey?: string
  explicitLevel?: ImmersionLevel
  allowBalanceFallback?: boolean
  knownSlugs?: Set<string>
  onProgress?: (msg: string) => void
  fetchHtml?: (url: string) => Promise<string | null>
  fallbackUrls?: string[]
}

export async function collectTopicCandidates(
  options: CollectTopicOptions,
): Promise<{ canonicalTopic: CanonicalTopic; candidates: CandidateEvaluation[] }> {
  const {
    topic,
    limit,
    apiKey,
    explicitLevel,
    allowBalanceFallback,
    knownSlugs = new Set(),
    onProgress,
    fetchHtml = fetchLessonHtml,
    fallbackUrls = [],
  } = options

  const canonicalTopic = findCanonicalTopic(topic) || {
    title: topic,
    slug: topic,
    level: 'A2',
    engVidLevel: 'A2' as ImmersionLevel,
    searchTerms: [topic],
  }

  const targetLevel = explicitLevel ?? canonicalTopic.engVidLevel
  onProgress?.(`[sync] buscando candidatas para tema "${canonicalTopic.title}" (nivel ${targetLevel})`)

  const seenUrls = new Set<string>()
  const candidatePosts: ArchivePost[] = []

  for (const query of canonicalTopic.searchTerms) {
    const posts = await searchArchiveByQuery({ query, level: targetLevel, perPage: Math.max(15, limit * 2) })
    for (const p of posts) {
      if (!seenUrls.has(p.link) && !knownSlugs.has(p.slug)) {
        seenUrls.add(p.link)
        candidatePosts.push(p)
      }
    }
    if (candidatePosts.length >= limit * 2) break
  }

  if (candidatePosts.length < limit) {
    for (const query of canonicalTopic.searchTerms) {
      const posts = await searchArchiveByQuery({ query, perPage: Math.max(10, limit) })
      for (const p of posts) {
        if (!seenUrls.has(p.link) && !knownSlugs.has(p.slug)) {
          seenUrls.add(p.link)
          candidatePosts.push(p)
        }
      }
      if (candidatePosts.length >= limit) break
    }
  }

  const cache = loadRelevanceCache()
  let cacheModified = false
  const directCandidates: CandidateEvaluation[] = []

  for (const post of candidatePosts) {
    if (directCandidates.length >= limit * 2) break
    const html = await fetchHtml(post.link)
    if (!html) continue
    const page = parseLessonPage(html, post.link)
    if (!page) continue

    const level = normalizeLevel(page.categories)
    const cacheKey = computeTopicCacheKey(page.youtubeVideoId, canonicalTopic.slug)
    let relevance: ImmersionTopicRelation = 'needs_review'
    let reason = 'Sin evaluar por modelo.'
    let confidence = 0.5

    const cached = cache[cacheKey]
    if (cached) {
      relevance = cached.relevance
      reason = cached.reason
      confidence = cached.confidence
    } else if (apiKey) {
      try {
        const classified = await classifyTopicRelevance(apiKey, {
          canonicalTopic,
          candidateVideo: { title: page.title, description: page.description, categories: page.categories, level },
        })
        relevance = classified.relevance
        reason = classified.reason
        confidence = classified.confidence
        cache[cacheKey] = { relevance, confidence, reason, cachedAt: new Date().toISOString() }
        cacheModified = true
      } catch (err) {
        onProgress?.(`  ⚠ error clasificando ${page.slug}: ${(err as Error).message}`)
      }
    }

    if (relevance === 'irrelevant') continue

    directCandidates.push({
      url: post.link,
      slug: page.slug,
      title: page.title,
      level,
      youtubeVideoId: page.youtubeVideoId,
      relevance,
      reason,
      confidence,
      assignmentType: 'direct',
    })
  }

  if (cacheModified) saveRelevanceCache(cache)

  const sorted = sortCandidatesByRelevance(directCandidates)

  if (sorted.length < limit && allowBalanceFallback && fallbackUrls.length > 0) {
    onProgress?.(`[sync] activando fallback balanceado (${limit - sorted.length} restantes)`)
    return { canonicalTopic, candidates: applyBalancedFallback(sorted, fallbackUrls, limit) }
  }

  return { canonicalTopic, candidates: sorted.slice(0, limit) }
}
