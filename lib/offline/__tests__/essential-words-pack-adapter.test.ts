import "fake-indexeddb/auto";
import { describe, expect, it, afterEach, vi } from "vitest";
import { db } from "@/lib/db";
import type { OfflineResourcePackRecord } from "@/lib/db";
import { loadEssentialWordsFromPack } from "../essential-words-pack-adapter";

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
  async delete(name: string) {
    return this.caches.delete(name);
  }
  async has(name: string) {
    return this.caches.has(name);
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

describe("loadEssentialWordsFromPack", () => {
  afterEach(async () => {
    await db.offlineResourcePacks.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the parsed words for a level with a ready receipt and valid cached JSON", async () => {
    const fake = installFakeCaches();
    const receipt = readyReceipt();
    await db.offlineResourcePacks.put(receipt);
    await seedCache(fake, receipt.cacheName, "/offline-packs/v1/A1/essential-words.json", {
      schemaVersion: 1,
      contentVersion: "v1",
      level: "A1",
      entries: [A1_WORD],
    });

    const result = await loadEssentialWordsFromPack("A1");

    expect(result).toEqual({ status: "ready", level: "A1", words: [A1_WORD] });
  });

  it("returns not-downloaded with reason 'missing' when no receipt exists", async () => {
    installFakeCaches();

    const result = await loadEssentialWordsFromPack("B1");

    expect(result).toEqual({ status: "not-downloaded", level: "B1", reason: "missing" });
  });

  it.each(["stale", "failed", "downloading"] as const)(
    "returns not-downloaded with reason '%s' for a %s receipt, never the cached words",
    async (status) => {
      const fake = installFakeCaches();
      const receipt = readyReceipt({ status });
      await db.offlineResourcePacks.put(receipt);
      // Even if a cache entry happens to exist (e.g. leftover from a prior
      // ready state before going stale), a non-ready receipt must not serve it.
      await seedCache(fake, receipt.cacheName, "/offline-packs/v1/A1/essential-words.json", {
        schemaVersion: 1,
        contentVersion: "v1",
        level: "A1",
        entries: [A1_WORD],
      });

      const result = await loadEssentialWordsFromPack("A1");

      expect(result).toEqual({ status: "not-downloaded", level: "A1", reason: status });
    }
  );

  it("returns not-downloaded with reason 'cache-read-failed' when the ready receipt's cache entry is missing", async () => {
    installFakeCaches();
    const receipt = readyReceipt();
    await db.offlineResourcePacks.put(receipt);
    // No seedCache call — receipt says ready but nothing was ever cached
    // under that name (simulates browser cache eviction).

    const result = await loadEssentialWordsFromPack("A1");

    expect(result).toEqual({ status: "not-downloaded", level: "A1", reason: "cache-read-failed" });
  });

  it("returns not-downloaded when the cached JSON is malformed", async () => {
    const fake = installFakeCaches();
    const receipt = readyReceipt();
    await db.offlineResourcePacks.put(receipt);
    await seedCache(fake, receipt.cacheName, "/offline-packs/v1/A1/essential-words.json", {
      unexpected: "shape",
    });

    const result = await loadEssentialWordsFromPack("A1");

    expect(result).toEqual({ status: "not-downloaded", level: "A1", reason: "cache-read-failed" });
  });

  it("refuses a cached file whose level does not match the requested level", async () => {
    const fake = installFakeCaches();
    const receipt = readyReceipt();
    await db.offlineResourcePacks.put(receipt);
    await seedCache(fake, receipt.cacheName, "/offline-packs/v1/A1/essential-words.json", {
      schemaVersion: 1,
      contentVersion: "v1",
      level: "B1",
      entries: [A1_WORD],
    });

    const result = await loadEssentialWordsFromPack("A1");

    expect(result).toEqual({ status: "not-downloaded", level: "A1", reason: "cache-read-failed" });
  });
});
