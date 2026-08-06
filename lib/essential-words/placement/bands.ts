// El conocimiento de vocabulario no es monotónico: alguien puede conocer
// términos técnicos poco frecuentes y fallar palabras más frecuentes de otro
// contexto. Una frontera única sería falsa; por eso, bandas.

import type { EssentialWord } from "../types";

export const BAND_COUNT = 6;
export const SAMPLES_PER_BAND = 5;

export interface FrequencyBand {
  id: string;
  words: EssentialWord[];
}

export function buildBands(words: EssentialWord[]): FrequencyBand[] {
  const sorted = [...words].sort((a, b) => a.rank - b.rank);
  const size = Math.ceil(sorted.length / BAND_COUNT);

  return Array.from({ length: BAND_COUNT }, (_, index) => ({
    id: `band-${index + 1}`,
    words: sorted.slice(index * size, (index + 1) * size),
  })).filter((band) => band.words.length > 0);
}

/** Semilla determinista: nada de Math.random, para poder reproducir. */
function seeded(seed: number): () => number {
  let state = seed | 0 || 1;

  return () => {
    state = Math.imul(state, 1_103_515_245) + 12_345 | 0;
    return (state >>> 0) / 4_294_967_296;
  };
}

/** Raíz aproximada, para no muestrear develop / developer / development. */
function stem(word: string): string {
  return word.toLowerCase().slice(0, 6);
}

/**
 * Muestreo estratificado por banda y por parte de la oración, evitando
 * familias léxicas: acertar `develop` no dice casi nada sobre `development`,
 * así que gastar dos de las ~30 muestras en la misma raíz es desperdiciarlas.
 */
export function sampleForPlacement(words: EssentialWord[], seed: number): EssentialWord[] {
  const random = seeded(seed);
  const usedStems = new Set<string>();
  const sample: EssentialWord[] = [];

  for (const band of buildBands(words)) {
    const byPos = new Map<string, EssentialWord[]>();
    for (const word of band.words) {
      const bucket = byPos.get(word.pos) ?? [];
      bucket.push(word);
      byPos.set(word.pos, bucket);
    }

    const buckets = [...byPos.values()];
    let taken = 0;
    let guard = 0;

    while (taken < SAMPLES_PER_BAND && guard < band.words.length * 2) {
      guard += 1;
      const bucket = buckets[Math.floor(random() * buckets.length)];
      if (!bucket || bucket.length === 0) continue;

      const candidate = bucket[Math.floor(random() * bucket.length)];
      const key = stem(candidate.word);
      if (usedStems.has(key)) continue;

      usedStems.add(key);
      sample.push(candidate);
      taken += 1;
    }
  }

  return sample;
}
