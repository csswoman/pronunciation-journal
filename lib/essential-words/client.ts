// Client-side dataset fetch. Chunks are static assets under /essential-words/ and
// HTTP-cacheable, so offline-cached sessions keep working. We always load
// every available chunk: mapping a due wordId back to its entry needs the
// whole dataset anyway (rank does not live in srsData).

import { z } from "zod";
import { EssentialWordChunkSchema, EssentialWordSchema } from "./schema";
import { MAX_CHUNKS, type EssentialWord } from "./types";

let cache: EssentialWord[] | null = null;
let pending: Promise<EssentialWord[]> | null = null;

const CoreDatasetSchema = z.object({
  version: z.literal(1),
  entries: z.array(EssentialWordSchema).nonempty(),
});

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
      const res = await fetch(`/essential-words/words-${String(n).padStart(3, "0")}.json`);
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(`[essential-words] chunk ${n} returned ${res.status}`);
      }

      const parsed = EssentialWordChunkSchema.safeParse(await res.json());
      if (!parsed.success) {
        console.error(`[essential-words] invalid chunk ${n}`, parsed.error);
        throw new Error(`[essential-words] invalid chunk ${n}`);
      }

      return parsed.data.entries;
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
    const words = (await loadCombinedDataset()) ?? await loadChunkedDataset();

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
}
