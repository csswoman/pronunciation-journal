import { targetHash } from './target-hash'
import type { ReaderPassage } from './types'
import type { ReaderTarget } from './select-targets'

const STALE_MS = 7 * 24 * 60 * 60 * 1000

export interface ResolveReaderPassageDeps {
  userId: string
  targets: ReaderTarget[]
  online: boolean
  now: number
  getCached: (userId: string, targetHash: string) => Promise<ReaderPassage | undefined>
  generate: (userId: string, targets: ReaderTarget[]) => Promise<ReaderPassage>
  save: (p: ReaderPassage) => Promise<void>
}

function hashOf(targets: ReaderTarget[]): string {
  return targetHash(targets.map((t) => t.word))
}

/**
 * Resolve the passage to show, applying stale-while-revalidate:
 *  - no targets → null
 *  - fresh cache (<7d) → serve it
 *  - stale cache (>=7d) + online → serve stale now, regenerate in background
 *  - no cache + online → generate + save synchronously
 *  - no cache offline → null
 * Background regeneration failures are swallowed (stale retained).
 */
export async function resolveReaderPassage(
  deps: ResolveReaderPassageDeps,
): Promise<ReaderPassage | null> {
  const { userId, targets, online, now, getCached, generate, save } = deps
  if (targets.length === 0) return null

  const cached = await getCached(userId, hashOf(targets))

  if (cached) {
    const age = now - Date.parse(cached.createdAt)
    if (age < STALE_MS) return cached
    if (online) {
      // revalidate in background; never block, never throw.
      void generate(userId, targets).then(save).catch(() => {})
    }
    return cached
  }

  if (!online) return null
  const fresh = await generate(userId, targets)
  await save(fresh)
  return fresh
}
