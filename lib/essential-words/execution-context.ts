/** Dependencies supplied to pure Essential Words policies at their I/O boundary. */
export interface ExecutionContext {
  now: Date;
  newId(): string;
}

/** Deterministic random dependency for tests and later simulations. */
export interface RandomSource {
  next(): number;
}

/** The only factory in this module allowed to read time and generate global IDs. */
export function systemExecutionContext(): ExecutionContext {
  return { now: new Date(), newId: () => crypto.randomUUID() };
}

/** Supplies a fixed clock and deterministic ID sequence to tests. */
export function fixedExecutionContext(now: Date, ids: string[]): ExecutionContext {
  let index = 0;
  return {
    now,
    newId: () => ids[index++] ?? `test-id-${index}`,
  };
}

/** Mulberry32 PRNG: reproducible values in [0, 1) for tests and simulations. */
export function seededRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  return {
    next: () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    },
  };
}
