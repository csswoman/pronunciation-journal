import "fake-indexeddb/auto";
import { describe, expect, it, afterEach, vi } from "vitest";
import { db } from "@/lib/db";
import {
  extractAudioUrlsFromDeck,
  downloadLesson,
  removeDownloadedLesson,
} from "../download-manager";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";

const mockDeck: GrammarStudyDeckData = {
  meta: {
    eyebrow: "Mazo de prueba",
    title: "Present Simple",
  },
  sounds: ["i", "u"],
  cards: [
    {
      id: "card-1",
      index: 1,
      tag: "Regla",
      title: "Uso básico",
      lede: "Explicación de prueba",
      blocks: [
        {
          type: "pronunciation",
          sound: "i",
          examples: [{ text: "see", ipa: "siː" }],
        },
      ],
    },
  ],
};

describe("download-manager", () => {
  afterEach(async () => {
    await db.downloadedLessons.clear();
    vi.restoreAllMocks();
  });

  it("extracts and dedupes audio urls from deck sounds and pronunciation blocks", () => {
    const urls = extractAudioUrlsFromDeck(mockDeck);
    expect(urls).toContain("/sounds/Close Front Unrounded Vowel.ogg");
    expect(urls).toContain("/sounds/Close Back Rounded Vowel.ogg");
    // Ensure no duplicates even though 'i' is in both deck.sounds and card block
    const uniqueCount = new Set(urls).size;
    expect(urls.length).toBe(uniqueCount);
  });

  it("downloads a lesson and saves record in Dexie", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDeck,
    } as unknown as Response);

    const record = await downloadLesson({
      trackId: "a1",
      lessonNumber: 1,
      slug: "a1-present-simple",
      title: "Present Simple",
    });

    expect(record.id).toBe("a1:1");
    expect(record.trackId).toBe("a1");
    expect(record.lessonNumber).toBe(1);
    expect(record.deck.cards).toHaveLength(1);
    expect(record.audioUrls.length).toBeGreaterThan(0);

    const stored = await db.downloadedLessons.get("a1:1");
    expect(stored).toBeDefined();
    expect(stored?.title).toBe("Present Simple");
  });

  it("removes downloaded lesson from Dexie", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDeck,
    } as unknown as Response);

    await downloadLesson({
      trackId: "a1",
      lessonNumber: 2,
      slug: "a1-present-simple",
      title: "Present Simple",
    });

    expect(await db.downloadedLessons.get("a1:2")).toBeDefined();

    await removeDownloadedLesson("a1:2");
    expect(await db.downloadedLessons.get("a1:2")).toBeUndefined();
  });
});
