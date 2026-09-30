/**
 * Reads what a `ready` CEFR pack contains straight from its own CacheStorage
 * cache (Plan 057, Step 5/6) — no network and no service-worker routing, so
 * the offline hub can list and open the pack's grammar lessons on a reload
 * without connection. Payloads stay in CacheStorage; nothing is copied into
 * Dexie (the lesson record built here is in-memory only).
 */

import type { DownloadedLessonRecord, OfflineResourcePackRecord } from "@/lib/db";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";
import { extractAudioUrlsFromDeck } from "./download-manager";
import {
  OFFLINE_PACK_MANIFEST_URL,
  isGrammarDeckResource,
  type GrammarDeckPackResource,
  type OfflinePackManifest,
} from "./pack-types";

async function readCachedJson<T>(cacheName: string, url: string): Promise<T | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(cacheName);
    const match = await cache.match(url);
    return match ? ((await match.json()) as T) : null;
  } catch {
    return null;
  }
}

/** The pack's grammar lessons in curriculum order, or `null` when the pack can't be read. */
export async function listPackLessons(
  receipt: OfflineResourcePackRecord,
): Promise<GrammarDeckPackResource[] | null> {
  if (receipt.status !== "ready") return null;
  const manifest = await readCachedJson<OfflinePackManifest>(receipt.cacheName, OFFLINE_PACK_MANIFEST_URL);
  const entry = manifest?.levels?.find((candidate) => candidate.level === receipt.level);
  if (!entry) return null;
  return entry.required
    .filter(isGrammarDeckResource)
    .sort((a, b) => a.lessonNumber - b.lessonNumber);
}

/**
 * Builds the same record shape `OfflineStudyDeck` renders for individually
 * downloaded lessons, from the pack cache. Returns `null` if the deck is not
 * in the cache (evicted) — the caller must say so, never show a blank deck.
 */
export async function loadPackLesson(
  receipt: OfflineResourcePackRecord,
  lesson: GrammarDeckPackResource,
): Promise<DownloadedLessonRecord | null> {
  const rawDeck = await readCachedJson<GrammarStudyDeckData>(receipt.cacheName, lesson.url);
  if (!rawDeck || !Array.isArray(rawDeck.cards)) return null;
  const deck: GrammarStudyDeckData = {
    ...rawDeck,
    cards: rawDeck.cards.map((card, i) => ({ ...card, index: i + 1 })),
  };
  const trackId = receipt.level.toLowerCase();
  return {
    id: `${trackId}:${lesson.lessonNumber}`,
    trackId,
    lessonNumber: lesson.lessonNumber,
    slug: lesson.slug,
    title: lesson.title,
    deck,
    audioUrls: extractAudioUrlsFromDeck(deck),
    downloadedAt: receipt.downloadedAt,
  };
}
