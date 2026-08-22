// Client-side dataset fetch. Chunks are static assets under /essential-words/ and
// HTTP-cacheable, so offline-cached sessions keep working. Chunks are fetched
// on-demand based on catalog-index.json to avoid loading 25MB uncompressed JSON.

import { z } from "zod";
import { EssentialWordChunkSchema, EssentialWordSchema } from "./schema";
import { MAX_CHUNKS, essentialWordId, type EssentialWord } from "./types";
import { parseCatalogIndex, type CatalogIndexEntry, type RawCatalogIndex } from "./catalog-index";

let cache: EssentialWord[] | null = null;
let pending: Promise<EssentialWord[]> | null = null;

let catalogIndexCache: CatalogIndexEntry[] | null = null;
let catalogIndexPending: Promise<CatalogIndexEntry[]> | null = null;

const chunkCache = new Map<number, EssentialWord[]>();
const chunkPending = new Map<number, Promise<EssentialWord[]>>();

const CoreDatasetSchema = z.object({
  version: z.literal(1),
  entries: z.array(EssentialWordSchema).nonempty(),
});

export async function fetchCatalogIndex(): Promise<CatalogIndexEntry[]> {
  if (catalogIndexCache) return catalogIndexCache;
  if (catalogIndexPending) return catalogIndexPending;

  catalogIndexPending = (async () => {
    const res = await fetch("/essential-words/catalog-index.json");
    if (!res.ok) {
      const words = await fetchEssentialWords();
      const derived: CatalogIndexEntry[] = words.map((w) => ({
        rank: w.rank,
        word: w.word,
        pos: w.pos,
        cefr_level: w.cefr_level,
        chunk: Math.ceil(w.rank / 100),
        ipa_strong: w.ipa_strong,
        ipa_weak: w.ipa_weak,
      }));
      catalogIndexCache = derived;
      return derived;
    }

    const raw = (await res.json()) as RawCatalogIndex;
    const parsed = parseCatalogIndex(raw);
    catalogIndexCache = parsed;
    return parsed;
  })().finally(() => {
    catalogIndexPending = null;
  });

  return catalogIndexPending;
}

export async function fetchChunk(n: number): Promise<EssentialWord[]> {
  if (chunkCache.has(n)) return chunkCache.get(n)!;
  if (chunkPending.has(n)) return chunkPending.get(n)!;

  const promise = (async () => {
    const res = await fetch(`/essential-words/words-${String(n).padStart(3, "0")}.json`);
    if (!res.ok) {
      throw new Error(`[essential-words] chunk ${n} returned ${res.status}`);
    }

    const parsed = EssentialWordChunkSchema.safeParse(await res.json());
    if (!parsed.success) {
      console.error(`[essential-words] invalid chunk ${n}`, parsed.error);
      throw new Error(`[essential-words] invalid chunk ${n}`);
    }

    chunkCache.set(n, parsed.data.entries);
    return parsed.data.entries;
  })().finally(() => {
    chunkPending.delete(n);
  });

  chunkPending.set(n, promise);
  return promise;
}

export async function fetchChunks(chunks: number[]): Promise<Map<string, EssentialWord>> {
  const uniqueChunks = Array.from(new Set(chunks.filter((n) => n >= 1 && n <= MAX_CHUNKS)));
  const chunkArrays = await Promise.all(uniqueChunks.map((n) => fetchChunk(n)));

  const map = new Map<string, EssentialWord>();
  for (const entries of chunkArrays) {
    for (const entry of entries) {
      map.set(essentialWordId(entry.word), entry);
    }
  }
  return map;
}

async function loadCombinedDataset(): Promise<EssentialWord[] | null> {
  const res = await fetch("/essential-words/words-all.json");
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`[essential-words] combined dataset returned ${res.status}`);
  }

  const parsed = CoreDatasetSchema.safeParse(await res.json());
  if (!parsed.success) {
    console.error("[essential-words] invalid combined dataset", parsed.error);
    throw new Error("[essential-words] invalid combined dataset");
  }

  return parsed.data.entries;
}

async function loadChunkedDataset(): Promise<EssentialWord[]> {
  const chunks = await Promise.all(
    Array.from({ length: MAX_CHUNKS }, async (_, index) => {
      const n = index + 1;
      try {
        return await fetchChunk(n);
      } catch {
        return null;
      }
    }),
  );

  const words: EssentialWord[] = [];
  for (const chunk of chunks) {
    if (chunk === null) break;
    words.push(...chunk);
  }

  return words;
}

export async function fetchEssentialWords(): Promise<EssentialWord[]> {
  if (cache) return cache;
  if (pending) return pending;

  pending = (async () => {
    const words = (await loadCombinedDataset()) ?? (await loadChunkedDataset());

    if (words.length === 0) {
      throw new Error("[essential-words] no dataset chunks loaded");
    }

    cache = words;
    return words;
  })().finally(() => {
    pending = null;
  });

  return pending;
}

/** Solo para tests. */
export function __resetEssentialWordsCache(): void {
  cache = null;
  pending = null;
  catalogIndexCache = null;
  catalogIndexPending = null;
  chunkCache.clear();
  chunkPending.clear();
}
