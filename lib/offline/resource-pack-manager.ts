/**
 * Public entry point for downloadable CEFR resource packs (Plan 057, Step 3).
 * Builds on the manifest types from `pack-types.ts` (Step 1) and the Dexie
 * receipt helpers from `lib/db` (Step 2).
 *
 * Implementation is split by concern:
 *  - `resource-pack-storage.ts` — cache naming, quota pre-flight,
 *    bounded-concurrency download + verification of URLs into a Cache.
 *  - `resource-pack-download.ts` — manifest read, optional Coach slice,
 *    cancellation, and `downloadResourcePack` itself.
 *  - `resource-pack-maintenance.ts` — `repairOrphanedReceipts` and
 *    `removeResourcePack`, which only read existing receipts/caches and
 *    never start a new download.
 *
 * Design contracts both halves must respect (see plan "Step 3" for the full
 * numbered list):
 *  - Dexie only ever receives ONE terminal write per level: `ready` or
 *    `failed`, written after the pack is fully verified or has definitively
 *    failed. In-flight progress is reported via `onProgress`, never persisted.
 *  - A level's CacheStorage cache name always embeds `contentVersion` *and*
 *    a per-download uniquifier, so a download in progress can NEVER collide
 *    with — and therefore can never corrupt — a still-`ready` previous pack
 *    for the same level, even when re-downloading the same contentVersion
 *    (e.g. a manual retry). See `buildPackCacheName`.
 *  - If a download fails and a previous `ready` receipt exists for that
 *    level, the old receipt is left completely untouched (not overwritten
 *    with `failed`) and the caller is informed via a thrown
 *    `ResourcePackDownloadError`, whose `reason` covers every failure point
 *    (`"manifest"` | `"quota"` | `"download"` | `"verification"`) so no
 *    failure path leaks a plain `Error` instead. Only a level with NO
 *    previous ready receipt gets a `failed` row written.
 *  - Removing a pack deletes only that pack's own CacheStorage cache and its
 *    own Dexie row. It never touches `downloadedLessons`, SRS/progress
 *    tables, or `contentBankCache` — Coach content-bank rows are owned
 *    exclusively by `download-manager.ts`'s `downloadCoachExercises` /
 *    `removeCoachExercisesOffline` (see CLAUDE.md "Coach ownership policy").
 */

export {
  ResourcePackDownloadError,
  fetchOfflinePackManifest,
  getManifestEntryForLevel,
  downloadResourcePack,
} from "./resource-pack-download";
export {
  buildPackCacheName,
  hasSufficientQuota,
  requiredCacheableUrls,
  verifyUrlsCached,
} from "./resource-pack-storage";
export type {
  ResourcePackDownloadProgress,
  DownloadResourcePackOptions,
  ResourcePackDownloadResult,
} from "./resource-pack-download";

export { repairOrphanedReceipts, removeResourcePack } from "./resource-pack-maintenance";

export { db } from "@/lib/db";
