import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  getDownloadedLesson,
  saveDownloadedLesson,
  deleteDownloadedLesson,
  type DownloadedLessonRecord,
} from "@/lib/db";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";
import { IPA_AUDIO_MAP, SOUNDS_BASE_URL } from "@/lib/pronunciation/ipa-audio";

export const OFFLINE_MEDIA_CACHE = "offline-lessons-media";

/**
 * Extracts all relevant audio asset URLs referenced by a grammar deck
 * to pre-cache them for offline playback.
 */
export function extractAudioUrlsFromDeck(deck: GrammarStudyDeckData): string[] {
  const urls = new Set<string>();

  // Check sounds declared at deck level
  if (deck.sounds && Array.isArray(deck.sounds)) {
    for (const sound of deck.sounds) {
      const filename = IPA_AUDIO_MAP[sound];
      if (filename) {
        urls.add(`${SOUNDS_BASE_URL}/${filename}`);
      }
    }
  }

  // Scan card blocks for pronunciation blocks
  for (const card of deck.cards) {
    if (!card.blocks) continue;
    for (const block of card.blocks) {
      if (block.type === "pronunciation" && block.sound) {
        const filename = IPA_AUDIO_MAP[block.sound];
        if (filename) {
          urls.add(`${SOUNDS_BASE_URL}/${filename}`);
        }
      }
    }
  }

  return Array.from(urls);
}

export interface DownloadLessonOptions {
  trackId: string;
  lessonNumber: number;
  slug: string;
  title: string;
}

/**
 * Downloads a lesson deck along with its audio dependencies and persists it in Dexie.
 */
export async function downloadLesson({
  trackId,
  lessonNumber,
  slug,
  title,
}: DownloadLessonOptions): Promise<DownloadedLessonRecord> {
  const id = `${trackId}:${lessonNumber}`;

  // 1. Fetch deck JSON
  const res = await fetch(`/grammar-decks/${slug}.json`);
  if (!res.ok) {
    throw new Error(`No se pudo descargar el mazo para la lección "${slug}" (código ${res.status})`);
  }

  const rawDeck = (await res.json()) as GrammarStudyDeckData;
  // Ensure cards have sequential 1-based indices
  const deck: GrammarStudyDeckData = {
    ...rawDeck,
    cards: (rawDeck.cards ?? []).map((card, i) => ({ ...card, index: i + 1 })),
  };

  // 2. Extract and pre-cache audio
  const audioUrls = extractAudioUrlsFromDeck(deck);
  if (typeof window !== "undefined" && "caches" in window && audioUrls.length > 0) {
    try {
      const cache = await caches.open(OFFLINE_MEDIA_CACHE);
      await Promise.allSettled(audioUrls.map((url) => cache.add(url)));
    } catch (cacheErr) {
      console.warn("[download-manager] Error al precachear audios:", cacheErr);
    }
  }

  // 3. Save to Dexie
  const record: DownloadedLessonRecord = {
    id,
    trackId,
    lessonNumber,
    slug,
    title,
    deck,
    audioUrls,
    downloadedAt: new Date().toISOString(),
  };

  await saveDownloadedLesson(record);
  return record;
}

/**
 * Removes a downloaded lesson from Dexie and cleans up cached audio assets.
 */
export async function removeDownloadedLesson(id: string): Promise<void> {
  const record = await getDownloadedLesson(id);
  await deleteDownloadedLesson(id);

  if (record && record.audioUrls.length > 0 && typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(OFFLINE_MEDIA_CACHE);
      await Promise.allSettled(record.audioUrls.map((url) => cache.delete(url)));
    } catch (cacheErr) {
      console.warn("[download-manager] Error al limpiar caché de audio:", cacheErr);
    }
  }
}

/**
 * Hook to list all downloaded lessons reactively.
 */
export function useAllDownloadedLessons() {
  const lessons = useLiveQuery(() => db.downloadedLessons.toArray(), [], []);
  return lessons;
}
