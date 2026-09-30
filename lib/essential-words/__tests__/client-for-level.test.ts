import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { db } from "@/lib/db";
import type { OfflineResourcePackRecord } from "@/lib/db";
import { __resetEssentialWordsCache, fetchEssentialWordsForLevel } from "../client";

// ── In-memory CacheStorage mock (same shape as resource-pack-manager.test.ts) ──

class FakeCache {
  store = new Map<string, Response>();
  async put(url: string, res: Response) {
    this.store.set(url, res);
  }
  async match(url: string) {
    return this.store.get(url);
  }
}

class FakeCacheStorage {
  caches = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.caches.has(name)) this.caches.set(name, new FakeCache());
    return this.caches.get(name)! as unknown as Cache;
  }
}

function installFakeCaches(): FakeCacheStorage {
  const fake = new FakeCacheStorage();
  vi.stubGlobal("caches", fake);
  return fake;
}

const A1_WORD = {
  rank: 1,
  word: "the",
  pos: "article",
  ipa_strong: "/ðiː/",
  example_sentence: "Give me the book please.",
  cefr_level: "A1",
} as const;

const B1_WORD = {
  rank: 500,
  word: "achieve",
  pos: "verb",
  ipa_strong: "/əˈtʃiːv/",
  example_sentence: "She wants to achieve her goals.",
  cefr_level: "B1",
} as const;

function readyReceipt(overrides: Partial<OfflineResourcePackRecord> = {}): OfflineResourcePackRecord {
  return {
    id: "A1",
    level: "A1",
    contentVersion: "v1",
    status: "ready",
    cacheName: "offline-pack-A1-v1-test",
    resourceCount: 1,
    estimatedBytes: 1000,
    downloadedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function seedCache(fake: FakeCacheStorage, cacheName: string, url: string, body: unknown) {
  const cache = await fake.open(cacheName);
  await cache.put(url, new Response(JSON.stringify(body)));
}

describe("fetchEssentialWordsForLevel", () => {
  beforeEach(() => {
    __resetEssentialWordsCache();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await db.offlineResourcePacks.clear();
    vi.unstubAllGlobals();
  });

  it("uses the network path and filters to the requested level when online", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: 1, entries: [A1_WORD, B1_WORD] }),
    }) as typeof global.fetch;

    const words = await fetchEssentialWordsForLevel("A1");

    expect(words).toEqual([A1_WORD]);
  });

  it("falls back to the pack adapter for a level with a ready offline pack when the network fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const fake = installFakeCaches();
    const receipt = readyReceipt();
    await db.offlineResourcePacks.put(receipt);
    await seedCache(fake, receipt.cacheName, "/offline-packs/v1/A1/essential-words.json", {
      schemaVersion: 1,
      contentVersion: "v1",
      level: "A1",
      entries: [A1_WORD],
    });

    const words = await fetchEssentialWordsForLevel("A1");

    expect(words).toEqual([A1_WORD]);
  });

  it("does NOT fall back to another level's pack or an empty array when this level has no pack", async () => {
    const networkError = new TypeError("Failed to fetch");
    global.fetch = vi.fn().mockRejectedValue(networkError);
    const fake = installFakeCaches();
    // Only A1 has a ready pack; B1 has none.
    const receipt = readyReceipt();
    await db.offlineResourcePacks.put(receipt);
    await seedCache(fake, receipt.cacheName, "/offline-packs/v1/A1/essential-words.json", {
      schemaVersion: 1,
      contentVersion: "v1",
      level: "A1",
      entries: [A1_WORD],
    });

    await expect(fetchEssentialWordsForLevel("B1")).rejects.toThrow("Failed to fetch");
  });
});
