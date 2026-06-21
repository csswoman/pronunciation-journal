// Client-side dataset fetch. Chunks are static assets under /core-1000/ and
// HTTP-cacheable, so offline-cached sessions keep working. We always load
// every available chunk: mapping a due wordId back to its entry needs the
// whole dataset anyway (rank does not live in srsData).

import { CoreChunkSchema } from "./schema";
import { MAX_CHUNKS, type CoreWord } from "./types";

let cache: CoreWord[] | null = null;
let pending: Promise<CoreWord[]> | null = null;

export async function fetchCoreWords(): Promise<CoreWord[]> {
  if (cache) return cache;
  if (pending) return pending;

  pending = (async () => {
    const chunks = await Promise.all(
      Array.from({ length: MAX_CHUNKS }, async (_, index) => {
        const n = index + 1;
        const res = await fetch(`/core-1000/words-${String(n).padStart(3, "0")}.json`);
        if (res.status === 404) return null;
        if (!res.ok) {
          throw new Error(`[core-1000] chunk ${n} returned ${res.status}`);
        }

        const parsed = CoreChunkSchema.safeParse(await res.json());
        if (!parsed.success) {
          console.error(`[core-1000] invalid chunk ${n}`, parsed.error);
          throw new Error(`[core-1000] invalid chunk ${n}`);
        }

        return parsed.data.entries;
      }),
    );

    const words: CoreWord[] = [];
    for (const chunk of chunks) {
      if (chunk === null) break;
      words.push(...chunk);
    }

    if (words.length === 0) {
      throw new Error("[core-1000] no dataset chunks loaded");
    }

    cache = words;
    return words;
  })().finally(() => {
    pending = null;
  });

  return pending;
}

/** Solo para tests. */
export function __resetCoreWordsCache(): void {
  cache = null;
  pending = null;
}
