import "fake-indexeddb/auto";
import { describe, expect, it, afterEach, vi } from "vitest";
import { db } from "@/lib/db";
import type { OfflineResourcePackRecord } from "@/lib/db";
import type { OfflinePackManifest } from "@/lib/offline/pack-types";
import {
  downloadResourcePack,
  repairOrphanedReceipts,
  removeResourcePack,
  ResourcePackDownloadError,
} from "../resource-pack-manager";
import { fetchBankItems } from "@/lib/content-bank/queries";

vi.mock("@/lib/content-bank/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content-bank/queries")>();
  return {
    ...actual,
    fetchBankItems: vi.fn(),
    cacheBankItems: actual.cacheBankItems,
  };
});

// ── In-memory CacheStorage mock ───────────────────────────────────────────

class FakeCache {
  store = new Map<string, Response>();
  async put(url: string, res: Response) {
    this.store.set(url, res);
  }
  async match(url: string) {
    return this.store.get(url);
  }
  async delete(url: string) {
    return this.store.delete(url);
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

function installNavigatorQuota(quota: number, usage: number) {
  vi.stubGlobal("navigator", {
    storage: {
      estimate: async () => ({ quota, usage }),
    },
  });
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const baseManifest: OfflinePackManifest = {
  schemaVersion: 1,
  contentVersion: "v1",
  generatedAt: new Date().toISOString(),
  levels: [
    {
      schemaVersion: 1,
      contentVersion: "v1",
      level: "A1",
      estimatedBytes: 1000,
      required: [
        { kind: "essential-words", url: "/offline-packs/v1/A1/essential-words.json", estimatedBytes: 700, wordCount: 740 },
        { kind: "grammar-deck", slug: "a1-verbo-to-be", title: "Verbo to be", lessonNumber: 1, url: "/grammar-decks/a1-verbo-to-be.json", estimatedBytes: 300 },
      ],
      optional: [{ kind: "coach-content-bank", level: "A1", maxExercises: 100 }],
    },
  ],
};

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return new Response(JSON.stringify(body), { status });
}

function makeFetch(overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/offline-packs/manifest.json") return jsonResponse(baseManifest);
    if (overrides[url]) return overrides[url]();
    return jsonResponse({ ok: true });
  }) as unknown as typeof fetch;
}

/** Shared shape for a pre-existing `ready` receipt fixture; override only what a test cares about. */
function makeReadyReceipt(overrides: Partial<OfflineResourcePackRecord> = {}): OfflineResourcePackRecord {
  return {
    id: "A1",
    level: "A1",
    contentVersion: "v0",
    status: "ready",
    cacheName: "offline-pack-A1-v0-old",
    resourceCount: 2,
    estimatedBytes: 900,
    downloadedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("resource-pack-manager", () => {
  afterEach(async () => {
    await db.offlineResourcePacks.clear();
    await db.contentBankCache.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("downloads a full pack, writes a ready receipt, and records coachCount", async () => {
    installFakeCaches();
    installNavigatorQuota(1_000_000_000, 0);
    vi.mocked(fetchBankItems).mockResolvedValueOnce([
      {
        id: "bank-1",
        kind: "coach_exercise",
        tool_name: "render_multiple_choice",
        level: "A1",
        topic_id: "present_simple",
        payload: { question: "Q1" },
        prompt_version: "v1",
        stem_hash: "hash-1",
        quality_flags: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    const result = await downloadResourcePack("A1", { fetchImpl: makeFetch() });

    expect(result.receipt.status).toBe("ready");
    expect(result.receipt.resourceCount).toBe(2);
    expect(result.coachCount).toBe(1);

    const stored = await db.offlineResourcePacks.get("A1");
    expect(stored?.status).toBe("ready");
    expect(stored?.cacheName).toBe(result.receipt.cacheName);
  });

  it("cleans up the cache and writes a failed receipt when there was no previous ready pack", async () => {
    installFakeCaches();
    installNavigatorQuota(1_000_000_000, 0);
    vi.mocked(fetchBankItems).mockResolvedValueOnce([]);

    const fetchImpl = makeFetch({
      "/grammar-decks/a1-verbo-to-be.json": () => new Response("nope", { status: 500 }),
    });

    await expect(downloadResourcePack("A1", { fetchImpl })).rejects.toThrow(ResourcePackDownloadError);

    const stored = await db.offlineResourcePacks.get("A1");
    expect(stored?.status).toBe("failed");

    // The partial cache created during this failed attempt must be gone.
    const fake = caches as unknown as FakeCacheStorage;
    expect(fake.caches.size).toBe(0);
  });

  it("cancel: deletes the partial cache and writes no receipt", async () => {
    const fake = installFakeCaches();
    installNavigatorQuota(1_000_000_000, 0);
    const controller = new AbortController();
    const fetchImpl = makeFetch({
      "/grammar-decks/a1-verbo-to-be.json": () => {
        controller.abort();
        return jsonResponse({ ok: true });
      },
    });

    await expect(
      downloadResourcePack("A1", { fetchImpl, signal: controller.signal }),
    ).rejects.toMatchObject({ reason: "cancelled" });
    expect(await db.offlineResourcePacks.get("A1")).toBeUndefined();
    expect(fake.caches.size).toBe(0);
  });

  it("preserves a previous ready receipt untouched when a new download fails", async () => {
    const fake = installFakeCaches();
    installNavigatorQuota(1_000_000_000, 0);

    const oldReadyReceipt = makeReadyReceipt();
    await db.offlineResourcePacks.put(oldReadyReceipt);
    await fake.open("offline-pack-A1-v0-old");

    vi.mocked(fetchBankItems).mockResolvedValueOnce([]);
    const fetchImpl = makeFetch({
      "/grammar-decks/a1-verbo-to-be.json": () => new Response("nope", { status: 500 }),
    });

    let caught: unknown;
    try {
      await downloadResourcePack("A1", { fetchImpl });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ResourcePackDownloadError);
    expect((caught as ResourcePackDownloadError).previousReceiptPreserved).toBe(true);

    // Old receipt is exactly as it was — not overwritten with `failed`.
    const stored = await db.offlineResourcePacks.get("A1");
    expect(stored).toEqual(oldReadyReceipt);

    // Old cache is untouched; only the new partial cache was removed.
    expect(await fake.has("offline-pack-A1-v0-old")).toBe(true);
    expect(fake.caches.size).toBe(1);
  });

  it("refuses to start when quota is clearly insufficient, before any fetch", async () => {
    installFakeCaches();
    installNavigatorQuota(1000, 999); // 1 byte free, manifest wants ~1000 bytes total

    const fetchImpl = makeFetch();

    await expect(downloadResourcePack("A1", { fetchImpl })).rejects.toMatchObject({
      reason: "quota",
    });

    // Only the manifest read may have happened (it hasn't, since quota check
    // is a pre-flight against the *manifest entry's* bytes, which requires
    // fetching the manifest itself first) — but no resource URLs were fetched.
    const calledUrls = vi.mocked(fetchImpl).mock.calls.map(([input]) =>
      typeof input === "string" ? input : String(input),
    );
    expect(calledUrls).not.toContain("/grammar-decks/a1-verbo-to-be.json");
    expect(calledUrls).not.toContain("/offline-packs/v1/A1/essential-words.json");

    expect(await db.offlineResourcePacks.get("A1")).toBeUndefined();
  });

  it("wraps a manifest read failure in ResourcePackDownloadError with reason 'manifest'", async () => {
    installFakeCaches();
    installNavigatorQuota(1_000_000_000, 0);
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 })) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await downloadResourcePack("A1", { fetchImpl });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ResourcePackDownloadError);
    expect((caught as ResourcePackDownloadError).reason).toBe("manifest");
    // Nothing was touched — no receipt written, no cache created.
    expect((caught as ResourcePackDownloadError).previousReceiptPreserved).toBe(true);
    expect(await db.offlineResourcePacks.get("A1")).toBeUndefined();
  });

  it("still reaches ready when the optional Coach download fails", async () => {
    installFakeCaches();
    installNavigatorQuota(1_000_000_000, 0);
    vi.mocked(fetchBankItems).mockRejectedValueOnce(new Error("network down"));

    const result = await downloadResourcePack("A1", { fetchImpl: makeFetch() });

    expect(result.receipt.status).toBe("ready");
    expect(result.coachCount).toBe(0);
  });

  it("update: a successful download replaces the old receipt, then drops the superseded cache", async () => {
    const fake = installFakeCaches();
    installNavigatorQuota(1_000_000_000, 0);

    const oldReceipt = makeReadyReceipt({ contentVersion: "v0", cacheName: "offline-pack-A1-v0-old" });
    await db.offlineResourcePacks.put(oldReceipt);
    const oldCache = await fake.open("offline-pack-A1-v0-old");
    await oldCache.put("/offline-packs/v0/A1/essential-words.json", jsonResponse({}));

    vi.mocked(fetchBankItems).mockResolvedValueOnce([]);
    const result = await downloadResourcePack("A1", { fetchImpl: makeFetch() });

    expect(result.receipt.status).toBe("ready");
    expect(result.receipt.contentVersion).toBe("v1");

    // Dexie row now points at the new receipt (single-write replace).
    const stored = await db.offlineResourcePacks.get("A1");
    expect(stored?.contentVersion).toBe("v1");
    expect(stored?.cacheName).toBe(result.receipt.cacheName);
    // Only after the new receipt is durable is the old cache removed.
    expect(await fake.has("offline-pack-A1-v0-old")).toBe(false);
    expect(await fake.has(result.receipt.cacheName)).toBe(true);
  });

  it("remove deletes only this pack's cache and Dexie row, leaving contentBankCache untouched", async () => {
    const fake = installFakeCaches();
    const receipt = makeReadyReceipt({ contentVersion: "v1", cacheName: "offline-pack-A1-v1-keep" });
    await db.offlineResourcePacks.put(receipt);
    await fake.open("offline-pack-A1-v1-keep");

    await db.contentBankCache.put({
      id: "bank-1",
      kind: "coach_exercise",
      tool_name: "render_multiple_choice",
      level: "A1",
      topic_id: "present_simple",
      payload: {},
      prompt_version: "v1",
      stem_hash: "hash-1",
      quality_flags: 0,
      created_at: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
    });

    await removeResourcePack("A1");

    expect(await db.offlineResourcePacks.get("A1")).toBeUndefined();
    expect(await fake.has("offline-pack-A1-v1-keep")).toBe(false);
    // Coach rows are owned by download-manager.ts, never touched here.
    expect(await db.contentBankCache.get("bank-1")).toBeDefined();
  });

  it("repairOrphanedReceipts flips a ready receipt to stale when a required URL is missing from its cache", async () => {
    const fake = installFakeCaches();

    const brokenReceipt = makeReadyReceipt({ contentVersion: "v1", cacheName: "offline-pack-A1-v1-broken" });
    await db.offlineResourcePacks.put(brokenReceipt);
    const brokenCache = await fake.open("offline-pack-A1-v1-broken");
    // Only one of the two required URLs is present — the other was evicted.
    await brokenCache.put("/offline-packs/v1/A1/essential-words.json", jsonResponse({}));

    await repairOrphanedReceipts(makeFetch());

    const stored = await db.offlineResourcePacks.get("A1");
    expect(stored?.status).toBe("stale");
  });

  it("repairOrphanedReceipts leaves an intact ready receipt as ready", async () => {
    const fake = installFakeCaches();

    const intactReceipt = makeReadyReceipt({ contentVersion: "v1", cacheName: "offline-pack-A1-v1-intact" });
    await db.offlineResourcePacks.put(intactReceipt);
    const intactCache = await fake.open("offline-pack-A1-v1-intact");
    await intactCache.put("/offline-packs/v1/A1/essential-words.json", jsonResponse({}));
    await intactCache.put("/grammar-decks/a1-verbo-to-be.json", jsonResponse({}));

    await repairOrphanedReceipts(makeFetch());

    const stored = await db.offlineResourcePacks.get("A1");
    expect(stored?.status).toBe("ready");
  });

  it("repairOrphanedReceipts skips this pass (without throwing) when the manifest fetch fails", async () => {
    installFakeCaches();

    const readyReceipt = makeReadyReceipt({ contentVersion: "v1", cacheName: "offline-pack-A1-v1-untouched" });
    await db.offlineResourcePacks.put(readyReceipt);

    const brokenFetch = vi.fn(async () => new Response("boom", { status: 500 })) as unknown as typeof fetch;

    await expect(repairOrphanedReceipts(brokenFetch)).resolves.toBeUndefined();

    // Receipt is left exactly as it was — repair could not check it this pass.
    const stored = await db.offlineResourcePacks.get("A1");
    expect(stored).toEqual(readyReceipt);
  });
});
