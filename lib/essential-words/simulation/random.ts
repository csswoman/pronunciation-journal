export interface RandomSource {
  next(): number;
  integer(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(values: readonly T[]): T;
}

/** Mulberry32 PRNG with deterministic helpers for the simulation harness. */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  const next = (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };

  return {
    next,
    integer: (min, max) => {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new Error("integer requires an inclusive integer range");
      }
      return min + Math.floor(next() * (max - min + 1));
    },
    chance: (probability) => {
      if (probability < 0 || probability > 1) {
        throw new Error("chance requires a probability between 0 and 1");
      }
      return next() < probability;
    },
    pick: <T>(values: readonly T[]): T => {
      if (values.length === 0) throw new Error("pick requires values");
      return values[Math.floor(next() * values.length)];
    },
  };
}
