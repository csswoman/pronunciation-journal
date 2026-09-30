/**
 * Manifest reading, the optional Coach content-bank slice, cancellation,
 * and `downloadResourcePack` (Plan 057, Step 3) itself — turning a level's
 * manifest entry into a verified, `ready` Dexie receipt. Cache/quota helpers
 * live in `resource-pack-storage.ts`; startup repair and pack removal in
 * `resource-pack-maintenance.ts`. `resource-pack-manager.ts` re-exports all
 * three; see that file for the full cross-cutting design contracts.
 */

import type { CefrLevel } from "@/lib/essential-words/types";
import {
  getOfflineResourcePack,
  saveOfflineResourcePack,
  type OfflineResourcePackRecord,
} from "@/lib/db";
import type { OfflinePackManifest, OfflinePackManifestEntry } from "@/lib/offline/pack-types";
import { OFFLINE_PACK_MANIFEST_URL, isCoachContentBankResource } from "@/lib/offline/pack-types";
import {
  buildPackCacheName,
  downloadRequiredUrls,
  hasSufficientQuota,
  requiredCacheableUrls,
  verifyUrlsCached,
} from "./resource-pack-storage";


/** Default Coach content-bank cap, matches `downloadCoachExercises`'s default and the product contract. */
const DEFAULT_COACH_MAX_EXERCISES = 100;

export class ResourcePackDownloadError extends Error {
  constructor(
    message: string,
    public readonly level: CefrLevel,
    public readonly reason: "quota" | "manifest" | "download" | "verification" | "cancelled",
    /** True when a previous `ready` receipt for this level was left untouched. */
    public readonly previousReceiptPreserved: boolean,
  ) {
    super(message);
    this.name = "ResourcePackDownloadError";
  }
}

export interface ResourcePackDownloadProgress {
  level: CefrLevel;
  phase: "manifest" | "quota" | "downloading" | "verifying" | "coach" | "done";
  completed: number;
  total: number;
}

export interface DownloadResourcePackOptions {
  /** Ephemeral progress callback — no state here is persisted (see file header). */
  onProgress?: (progress: ResourcePackDownloadProgress) => void;
  /** Override for tests; production callers should omit this. */
  fetchImpl?: typeof fetch;
  /**
   * Cancels the download. The partial cache is deleted and NO receipt is
   * written — a cancel is the learner's choice, not a failure to record.
   */
  signal?: AbortSignal;
}

export interface ResourcePackDownloadResult {
  receipt: OfflineResourcePackRecord;
  /**
   * Purely informational count of Coach exercises cached alongside the pack
   * (product contract: "el recibo del pack registra coachCount solo como
   * información"). Not persisted on `OfflineResourcePackRecord` — that
   * schema is Step 2's, already shipped — so it's returned here instead for
   * whatever UI layer wants to display it.
   */
  coachCount: number;
}

/** Fetches and shallow-validates the static manifest served from `public/offline-packs/manifest.json`. */
export async function fetchOfflinePackManifest(
  fetchImpl: typeof fetch = fetch,
): Promise<OfflinePackManifest> {
  const res = await fetchImpl(OFFLINE_PACK_MANIFEST_URL);
  if (!res.ok) {
    throw new Error(`No se pudo leer el manifiesto de paquetes offline (código ${res.status})`);
  }
  const manifest = (await res.json()) as OfflinePackManifest;
  if (!manifest || !Array.isArray(manifest.levels) || typeof manifest.contentVersion !== "string") {
    throw new Error("El manifiesto de paquetes offline tiene un formato inválido");
  }
  return manifest;
}

export function getManifestEntryForLevel(
  manifest: OfflinePackManifest,
  level: CefrLevel,
): OfflinePackManifestEntry {
  const entry = manifest.levels.find((candidate) => candidate.level === level);
  if (!entry) {
    throw new Error(`No existe un paquete offline para el nivel "${level}"`);
  }
  return entry;
}

/**
 * Downloads up to `maxExercises` Coach exercises for `level` into the shared
 * `contentBankCache` (same table/rows the standalone Coach download uses —
 * see `resource-pack-manager.ts`'s ownership note). Never throws: a Coach
 * failure must not fail the required part of the pack (product contract item
 * 4, plan step 7).
 */
async function downloadOptionalCoachResource(
  level: CefrLevel,
  maxExercises: number,
): Promise<number> {
  try {
    const { fetchBankItems, cacheBankItems } = await import("@/lib/content-bank/queries");
    const items = await fetchBankItems(level, undefined, maxExercises);
    if (items.length > 0) {
      await cacheBankItems(items);
    }
    return items.length;
  } catch {
    return 0;
  }
}

/**
 * Downloads and verifies a level's full resource pack. Writes the Dexie
 * receipt only once, at the very end, and only ever with a terminal status
 * (`ready`, or `failed` when there was nothing to protect — see
 * `resource-pack-manager.ts`'s design contracts).
 *
 * On failure, throws `ResourcePackDownloadError` — including for a manifest
 * read/lookup failure (bad response, malformed JSON, unknown level), which
 * happens before anything is touched, so `previousReceiptPreserved` is
 * trivially `true` there. Callers should inspect `previousReceiptPreserved`
 * to know whether the level still has a working offline pack (the old
 * `ready` receipt) despite this failure.
 */
export async function downloadResourcePack(
  level: CefrLevel,
  options: DownloadResourcePackOptions = {},
): Promise<ResourcePackDownloadResult> {
  const { onProgress, fetchImpl = fetch, signal } = options;
  const previousReceipt = await getOfflineResourcePack(level);

  onProgress?.({ level, phase: "manifest", completed: 0, total: 1 });
  let manifest: OfflinePackManifest;
  let entry: OfflinePackManifestEntry;
  try {
    manifest = await fetchOfflinePackManifest(fetchImpl);
    entry = getManifestEntryForLevel(manifest, level);
  } catch (err) {
    // Nothing has been created or touched yet (no cache opened, no Dexie
    // write) — the previous receipt, if any, is trivially still intact.
    throw new ResourcePackDownloadError(
      err instanceof Error ? err.message : `No se pudo leer el manifiesto para el nivel ${level}`,
      level,
      "manifest",
      true,
    );
  }

  onProgress?.({ level, phase: "quota", completed: 0, total: 1 });
  const quota = await hasSufficientQuota(entry.estimatedBytes);
  if (!quota.ok) {
    // Refused before any fetch — nothing to clean up, no receipt touched.
    throw new ResourcePackDownloadError(
      `Espacio insuficiente para descargar el paquete de nivel ${level}`,
      level,
      "quota",
      true,
    );
  }

  const cacheName = buildPackCacheName(level, entry.contentVersion);
  if (typeof caches === "undefined") {
    throw new ResourcePackDownloadError(
      "CacheStorage no está disponible en este navegador",
      level,
      "download",
      previousReceipt?.status === "ready",
    );
  }
  const cache = await caches.open(cacheName);

  const requiredUrls = requiredCacheableUrls(entry.required);

  const cleanupAndFail = async (reason: ResourcePackDownloadError["reason"], message: string) => {
    await caches.delete(cacheName);
    const hadReadyReceipt = previousReceipt?.status === "ready";
    if (!hadReadyReceipt) {
      const failedRecord: OfflineResourcePackRecord = {
        id: level,
        level,
        contentVersion: entry.contentVersion,
        status: "failed",
        cacheName,
        resourceCount: 0,
        estimatedBytes: entry.estimatedBytes,
        downloadedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        error: message,
      };
      await saveOfflineResourcePack(failedRecord);
    }
    // hadReadyReceipt === true: deliberately leave the previous `ready` row
    // untouched (see resource-pack-manager.ts / plan point 10).
    throw new ResourcePackDownloadError(message, level, reason, hadReadyReceipt);
  };

  const throwIfCancelled = async () => {
    if (!signal?.aborted) return;
    await caches.delete(cacheName);
    throw new ResourcePackDownloadError(
      `Descarga del paquete ${level} cancelada`,
      level,
      "cancelled",
      previousReceipt?.status === "ready",
    );
  };

  try {
    onProgress?.({ level, phase: "downloading", completed: 0, total: requiredUrls.length });
    await downloadRequiredUrls(cache, requiredUrls, fetchImpl, {
      signal,
      onEach: (completed, total) => {
        onProgress?.({ level, phase: "downloading", completed, total });
      },
    });
    await throwIfCancelled();

    onProgress?.({ level, phase: "verifying", completed: 0, total: requiredUrls.length });
    const verified = await verifyUrlsCached(cache, requiredUrls);
    if (!verified) {
      await cleanupAndFail(
        "verification",
        `No se pudieron verificar todos los recursos requeridos del paquete ${level}`,
      );
    }
    // A snapshot of the manifest travels with the pack so the offline hub can
    // list this level's lessons without the network (see pack-contents.ts).
    await cache.put(
      OFFLINE_PACK_MANIFEST_URL,
      new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } }),
    );
  } catch (err) {
    if (err instanceof ResourcePackDownloadError) throw err;
    await cleanupAndFail(
      "download",
      err instanceof Error ? err.message : `Fallo desconocido al descargar el paquete ${level}`,
    );
  }

  // Coach content is optional: attempted after required resources verify ok,
  // its own failure never invalidates the pack (see downloadOptionalCoachResource).
  onProgress?.({ level, phase: "coach", completed: 0, total: 1 });
  const coachResource = entry.optional.find(isCoachContentBankResource);
  const coachCount = await downloadOptionalCoachResource(
    level,
    coachResource?.maxExercises ?? DEFAULT_COACH_MAX_EXERCISES,
  );
  await throwIfCancelled();

  const readyRecord: OfflineResourcePackRecord = {
    id: level,
    level,
    contentVersion: entry.contentVersion,
    status: "ready",
    cacheName,
    resourceCount: requiredUrls.length,
    estimatedBytes: entry.estimatedBytes,
    downloadedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
  };
  // Single atomic put; replaces any previous row (ready or failed) for this
  // level in one write, per the Step 2 Dexie design contract.
  await saveOfflineResourcePack(readyRecord);

  // The new receipt is durable, so the superseded cache (previous ready,
  // stale or failed attempt) is now unreferenced — drop it so updates don't
  // leak a full pack's worth of CacheStorage per version.
  if (previousReceipt && previousReceipt.cacheName !== cacheName) {
    try {
      await caches.delete(previousReceipt.cacheName);
    } catch {
      // Best-effort: an orphaned cache wastes space but breaks nothing.
    }
  }

  onProgress?.({ level, phase: "done", completed: 1, total: 1 });
  return { receipt: readyRecord, coachCount };
}
