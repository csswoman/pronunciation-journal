// Client-side dataset fetch. Chunks are static assets under /core-1000/ and
// HTTP-cacheable, so offline-cached sessions keep working. We always load
// every available chunk: mapping a due wordId back to its entry needs the
// whole dataset anyway (rank does not live in srsData).

import { CoreChunkSchema } from "./schema";
import { MAX_CHUNKS, type CoreWord } from "./types";

let cache: CoreWord[] | null = null;

export async function fetchCoreWords(): Promise<CoreWord[]> {
  if (cache) return cache;
  const words: CoreWord[] = [];
  for (let n = 1; n <= MAX_CHUNKS; n++) {
    const res = await fetch(`/core-1000/words-${String(n).padStart(3, "0")}.json`);
    if (!res.ok) break; // chunks contiguos: el primero ausente termina la serie
    const parsed = CoreChunkSchema.safeParse(await res.json());
    if (!parsed.success) {
      console.error(`[core-1000] invalid chunk ${n}`, parsed.error);
      break;
    }
    words.push(...parsed.data.entries);
  }
  cache = words;
  return words;
}

/** Solo para tests. */
export function __resetCoreWordsCache(): void {
  cache = null;
}
