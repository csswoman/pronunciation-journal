/**
 * Reads Essential Words for one CEFR level from a downloaded offline
 * resource pack (Plan 057, Step 4), so `lib/essential-words/client.ts` can
 * fall back to it when a normal network fetch fails offline.
 *
 * This module is deliberately CacheStorage/Dexie-only — no `fetch()` of its
 * own — so it never touches the network, and it never invents data: a level
 * with no `ready` receipt returns an explicit "not downloaded" result rather
 * than an empty array (which a caller could mistake for "this level has zero
 * words") or another level's data.
 */

import { getOfflineResourcePack, isOfflineResourcePackReady } from "@/lib/db";
import type { CefrLevel, EssentialWord } from "@/lib/essential-words/types";

export type EssentialWordsPackUnavailableReason =
  /** No receipt exists for this level at all — never downloaded. */
  | "missing"
  /** A download is in flight; nothing verified yet to serve. */
  | "downloading"
  /** A previously-ready pack was superseded and is no longer offered offline. */
  | "stale"
  /** The last download attempt for this level failed verification. */
  | "failed"
  /**
   * The receipt says `ready` but the CacheStorage entry could not be read or
   * parsed (evicted cache, corrupted JSON, browser storage pressure). This
   * should be rare — `downloadResourcePack` only writes `ready` after
   * verifying every required URL is cached — but a cache can still be
   * evicted by the browser after the fact, so callers must not assume
   * `ready` in Dexie implies a readable cache entry.
   */
  | "cache-read-failed";

export type EssentialWordsPackResult =
  | { status: "ready"; level: CefrLevel; words: EssentialWord[] }
  | { status: "not-downloaded"; level: CefrLevel; reason: EssentialWordsPackUnavailableReason };

/**
 * Shape of the on-disk `essential-words.json` written by
 * `scripts/offline-packs/generate.mjs` for one level. NOTE: this is a
 * different wrapper than `lib/essential-words/client.ts`'s chunk files
 * (`{ version: 1, entries }`) — the pack file carries `schemaVersion`,
 * `contentVersion` and `level` instead (see `pack-types.ts`'s
 * `OfflinePackManifestEntry` for the sibling shape). Because the wrapper
 * differs, this validates its own shape rather than reusing client.ts's
 * `isPlausibleDataset` — but it follows the exact same philosophy documented
 * there: a manual shape-check (not Zod) because this is our own generated,
 * versioned static asset, not untrusted input, and the full Zod schema in
 * `lib/essential-words/schema.ts` already validates it at build/test time.
 */
interface RawLevelDataset {
  schemaVersion: unknown;
  contentVersion: unknown;
  level: unknown;
  entries: unknown;
}

function isPlausibleLevelDataset(
  raw: unknown
): raw is { schemaVersion: number; contentVersion: string; level: CefrLevel; entries: EssentialWord[] } {
  if (typeof raw !== "object" || raw === null) return false;
  const { schemaVersion, contentVersion, level, entries } = raw as RawLevelDataset;
  return (
    typeof schemaVersion === "number" &&
    typeof contentVersion === "string" &&
    typeof level === "string" &&
    Array.isArray(entries) &&
    entries.length > 0
  );
}

/**
 * Mirrors `scripts/offline-packs/generate.mjs`'s output path
 * (`public/offline-packs/<contentVersion>/<level>/essential-words.json`,
 * served at the site-relative URL of the same shape) and
 * `resource-pack-download.ts`'s manifest-generated resource `url`. Built
 * from the receipt's own `contentVersion` (not the current
 * `OFFLINE_PACK_CONTENT_VERSION` constant) since a `ready` receipt is only
 * ever written for the version it actually downloaded.
 */
function essentialWordsPackUrl(contentVersion: string, level: CefrLevel): string {
  return `/offline-packs/${contentVersion}/${level}/essential-words.json`;
}

function unavailableReasonForStatus(
  status: "downloading" | "stale" | "failed"
): EssentialWordsPackUnavailableReason {
  return status;
}

/**
 * Looks up `level`'s offline resource pack and, if a `ready` receipt exists
 * with a readable cached `essential-words.json`, returns its words. Never
 * falls back to another level or to a partial/empty result silently — every
 * non-"ready" outcome carries an explicit `reason`.
 */
export async function loadEssentialWordsFromPack(level: CefrLevel): Promise<EssentialWordsPackResult> {
  const receipt = await getOfflineResourcePack(level);
  if (!receipt) {
    return { status: "not-downloaded", level, reason: "missing" };
  }
  if (!isOfflineResourcePackReady(receipt)) {
    return {
      status: "not-downloaded",
      level,
      reason: unavailableReasonForStatus(receipt.status as "downloading" | "stale" | "failed"),
    };
  }

  if (typeof caches === "undefined") {
    return { status: "not-downloaded", level, reason: "cache-read-failed" };
  }

  try {
    const cache = await caches.open(receipt.cacheName);
    const url = essentialWordsPackUrl(receipt.contentVersion, level);
    const match = await cache.match(url);
    if (!match) {
      return { status: "not-downloaded", level, reason: "cache-read-failed" };
    }

    const raw: unknown = await match.json();
    // A file for another level must never be served under this one.
    if (!isPlausibleLevelDataset(raw) || raw.level !== level) {
      return { status: "not-downloaded", level, reason: "cache-read-failed" };
    }

    return { status: "ready", level, words: raw.entries };
  } catch {
    return { status: "not-downloaded", level, reason: "cache-read-failed" };
  }
}
