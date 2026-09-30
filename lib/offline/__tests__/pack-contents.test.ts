import { afterEach, describe, expect, it, vi } from "vitest";
import type { OfflineResourcePackRecord } from "@/lib/db";
import type { GrammarDeckPackResource, OfflinePackManifest } from "../pack-types";
import { listPackLessons, loadPackLesson } from "../pack-contents";

class FakeCache {
  store = new Map<string, Response>();
  async put(url: string, res: Response) {
    this.store.set(url, res);
  }
  async match(url: string) {
    return this.store.get(url)?.clone();
  }
}

function installCache(entries: Record<string, unknown>) {
  const cache = new FakeCache();
  for (const [url, body] of Object.entries(entries)) void cache.put(url, new Response(JSON.stringify(body)));
  vi.stubGlobal("caches", { open: async () => cache });
}

const receipt: OfflineResourcePackRecord = {
  id: "A2",
  level: "A2",
  contentVersion: "v1",
  status: "ready",
  cacheName: "offline-pack-A2-v1-x",
  resourceCount: 3,
  estimatedBytes: 100,
  downloadedAt: "2026-09-29T00:00:00.000Z",
  lastVerifiedAt: "2026-09-29T00:00:00.000Z",
};

const lessonB: GrammarDeckPackResource = {
  kind: "grammar-deck", slug: "a2-b", title: "Lección B", lessonNumber: 7, url: "/grammar-decks/a2-b.json", estimatedBytes: 1,
};
const lessonA: GrammarDeckPackResource = {
  kind: "grammar-deck", slug: "a2-a", title: "Lección A", lessonNumber: 3, url: "/grammar-decks/a2-a.json", estimatedBytes: 1,
};

const manifest: OfflinePackManifest = {
  schemaVersion: 1,
  contentVersion: "v1",
  generatedAt: "",
  levels: [
    {
      schemaVersion: 1, contentVersion: "v1", level: "A2", estimatedBytes: 2,
      required: [
        { kind: "essential-words", url: "/offline-packs/v1/A2/essential-words.json", estimatedBytes: 1, wordCount: 645 },
        lessonB,
        lessonA,
      ],
      optional: [],
    },
  ],
};

describe("pack-contents", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists the pack's lessons in curriculum order from the cached manifest", async () => {
    installCache({ "/offline-packs/manifest.json": manifest });
    expect(await listPackLessons(receipt)).toEqual([lessonA, lessonB]);
  });

  it("returns null for a pack that is not ready", async () => {
    installCache({ "/offline-packs/manifest.json": manifest });
    expect(await listPackLessons({ ...receipt, status: "stale" })).toBeNull();
  });

  it("builds an in-memory lesson record from the cached deck", async () => {
    installCache({
      "/grammar-decks/a2-a.json": { meta: { eyebrow: "", title: "A" }, cards: [{ id: "c", index: 9, tag: "", title: "", lede: "", blocks: [] }] },
    });
    const record = await loadPackLesson(receipt, lessonA);
    expect(record).toMatchObject({ id: "a2:3", trackId: "a2", lessonNumber: 3, slug: "a2-a", title: "Lección A" });
    expect(record?.deck.cards[0].index).toBe(1);
  });

  it("returns null when the deck was evicted from the cache", async () => {
    installCache({});
    expect(await loadPackLesson(receipt, lessonA)).toBeNull();
  });
});
