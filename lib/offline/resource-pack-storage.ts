/**
 * CacheStorage + quota helpers shared by `resource-pack-download.ts` and
 * `resource-pack-maintenance.ts` (Plan 057, Step 3). Nothing here touches
 * Dexie or the manifest — it only names caches, sizes storage, and moves
 * URLs in and out of a given `Cache`.
 */

import type { CefrLevel } from "@/lib/essential-words/types";
import type { OfflinePackResource } from "@/lib/offline/pack-types";
import { isCoachContentBankResource } from "@/lib/offline/pack-types";

/**
 * How many resources download at once. Browsers cap concurrent connections
 * per origin around 6; we stay under that so the pack download doesn't starve
 * other in-flight app requests (auth refresh, Supabase realtime, etc.) on the
 * same origin while a large pack downloads in the background.
 */
const DOWNLOAD_CONCURRENCY = 5;

/**
 * Required extra headroom beyond the manifest's `estimatedBytes` before we'll
 * start a download. `estimatedBytes` is measured from on-disk file sizes at
 * generation time; actual bytes written to CacheStorage can differ slightly
 * (response headers, HTTP/2 framing), and other tabs/features may grow their
 * own storage concurrently with this download. 20% is a deliberately simple,
 * generous margin — this is a coarse pre-flight refusal, not a byte-exact
 * budget enforcer.
 */
const QUOTA_SAFETY_MARGIN_RATIO = 1.2;

/** Prefix shared by every pack cache; the service worker reads caches by it. */
export const OFFLINE_PACK_CACHE_PREFIX = "offline-pack-";

/** Per-level, per-content-version, per-attempt cache name — see resource-pack-manager.ts. */
export function buildPackCacheName(level: CefrLevel, contentVersion: string): string {
  const uniquifier =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${OFFLINE_PACK_CACHE_PREFIX}${level}-${contentVersion}-${uniquifier}`;
}

/**
 * Pre-flight quota check. Returns `ok: true` when `navigator.storage` isn't
 * available at all (older browsers, some test environments) — we can't
 * refuse a download we have no way to size-check, so we let it proceed and
 * rely on the later verification step to catch a genuinely failed download.
 */
export async function hasSufficientQuota(
  estimatedBytes: number,
): Promise<{ ok: boolean; availableBytes?: number }> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { ok: true };
  }
  try {
    const { quota, usage } = await navigator.storage.estimate();
    if (typeof quota !== "number" || typeof usage !== "number") {
      return { ok: true };
    }
    const availableBytes = quota - usage;
    return { ok: availableBytes >= estimatedBytes * QUOTA_SAFETY_MARGIN_RATIO, availableBytes };
  } catch {
    // storage.estimate() itself can reject in some environments; don't block on it.
    return { ok: true };
  }
}

/** Runs `fn` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

/**
 * Every resource kind except the Coach placeholder carries a static `url`
 * fetched straight into CacheStorage; Coach is downloaded through Supabase
 * queries instead (see `resource-pack-download.ts`).
 */
export function requiredCacheableUrls(resources: OfflinePackResource[]): string[] {
  return resources.filter((r) => !isCoachContentBankResource(r)).map((r) => r.url);
}

/**
 * Downloads every URL into `cache`, bounded concurrency. Never throws —
 * failures (including an abort via `signal`) surface via verification.
 */
export async function downloadRequiredUrls(
  cache: Cache,
  urls: string[],
  fetchImpl: typeof fetch,
  options: { signal?: AbortSignal; onEach?: (completed: number, total: number) => void } = {},
): Promise<void> {
  const { signal, onEach } = options;
  let completed = 0;
  await mapWithConcurrency(urls, DOWNLOAD_CONCURRENCY, async (url) => {
    try {
      if (signal?.aborted) return;
      const res = await fetchImpl(url, { signal });
      if (res.ok) {
        await cache.put(url, res.clone());
      }
    } catch {
      // Swallow — verification checks presence, which is the real gate.
    } finally {
      completed += 1;
      onEach?.(completed, urls.length);
    }
  });
}

/**
 * True only if every URL is cached (implies it was a genuinely ok response —
 * see `downloadRequiredUrls`, which only `cache.put`s on `res.ok`).
 */
export async function verifyUrlsCached(cache: Cache, urls: string[]): Promise<boolean> {
  const checks = await mapWithConcurrency(urls, DOWNLOAD_CONCURRENCY, (url) => cache.match(url));
  return checks.every((match) => match !== undefined);
}
