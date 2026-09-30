/**
 * Startup repair and removal for CEFR resource packs (Plan 057, Step 3).
 * Split out from `resource-pack-download.ts` — this half only reads
 * existing Dexie receipts and CacheStorage caches, it never starts a new
 * download. See `resource-pack-manager.ts` for the shared design contracts
 * (Coach ownership policy, single-terminal-write rule, etc).
 */

import type { CefrLevel } from "@/lib/essential-words/types";
import {
  getOfflineResourcePack,
  saveOfflineResourcePack,
  deleteOfflineResourcePack,
  listOfflineResourcePacks,
} from "@/lib/db";
import { fetchOfflinePackManifest } from "./resource-pack-download";
import { requiredCacheableUrls, verifyUrlsCached } from "./resource-pack-storage";

/**
 * Startup repair pass: flips a `ready` receipt to `stale` if its CacheStorage
 * cache no longer has one of the level's required URLs (evicted by the
 * browser, cleared by the user, etc.) so the UI never claims "available
 * offline" for a broken pack. Never promotes a receipt back to `ready` on its
 * own — that only happens through a fresh `downloadResourcePack`.
 *
 * Known limitation: this checks cache contents against the *current*
 * manifest's required list for the level, not a historical snapshot pinned
 * to the receipt's own `contentVersion`. If the manifest's required set
 * changes without a content-version bump, this could over- or under-report.
 * That's out of scope here — `contentVersion` bumps are the documented
 * trigger for a fresh download (see pack-types.ts).
 *
 * Intentionally defensive throughout, manifest fetch included: this runs at
 * app startup, so a flaky network or a transient manifest 500 should skip
 * this pass (leaving existing `ready` receipts as-is, to be retried on the
 * next startup) rather than throw and disrupt app boot. A genuinely broken
 * pack is still caught by verification the next time its owner tries to use
 * it, or by a later successful repair pass.
 */
export async function repairOrphanedReceipts(fetchImpl: typeof fetch = fetch): Promise<void> {
  const receipts = await listOfflineResourcePacks();
  const readyReceipts = receipts.filter((r) => r.status === "ready");
  if (readyReceipts.length === 0) return;
  if (typeof caches === "undefined") return;

  let manifest;
  try {
    manifest = await fetchOfflinePackManifest(fetchImpl);
  } catch (err) {
    console.warn("[resource-pack-maintenance] Omitiendo reparación: no se pudo leer el manifiesto", err);
    return;
  }

  for (const receipt of readyReceipts) {
    const entry = manifest.levels.find((candidate) => candidate.level === receipt.level);
    if (!entry) continue;

    let cache: Cache;
    try {
      cache = await caches.open(receipt.cacheName);
    } catch {
      continue;
    }

    const requiredUrls = requiredCacheableUrls(entry.required);
    const intact = await verifyUrlsCached(cache, requiredUrls);
    if (!intact) {
      await saveOfflineResourcePack({
        ...receipt,
        status: "stale",
        lastVerifiedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Deletes a level's pack: its own CacheStorage cache and its own Dexie row
 * only. Never touches `downloadedLessons`, progress/SRS tables, or
 * `contentBankCache` (Coach ownership policy — see resource-pack-manager.ts).
 */
export async function removeResourcePack(level: CefrLevel): Promise<void> {
  const receipt = await getOfflineResourcePack(level);
  if (!receipt) return;

  if (typeof caches !== "undefined") {
    try {
      await caches.delete(receipt.cacheName);
    } catch {
      // Best-effort: still remove the Dexie row so the UI stops claiming
      // this pack is offline-available even if cache cleanup failed.
    }
  }

  await deleteOfflineResourcePack(level);
}
