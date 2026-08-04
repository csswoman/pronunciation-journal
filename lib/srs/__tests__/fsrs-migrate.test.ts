import { describe, expect, it } from "vitest";
import { deriveFsrsState } from "../fsrs-migrate";
import type { SRSData } from "@/lib/types";

const NOW = new Date("2026-08-04T00:00:00.000Z");
const DAY_MS = 86_400_000;

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * DAY_MS).toISOString();
}

function makeCard(overrides: Partial<SRSData> = {}): SRSData {
  return {
    wordId: "c1k:test",
    word: "test",
    ease: 2.5,
    interval: 30,
    repetitions: 3,
    nextReview: daysAgo(-30),
    lastReview: daysAgo(1),
    ...overrides,
  };
}

describe("deriveFsrsState — healthy card (elapsedDays <= interval)", () => {
  it("uses interval as stability, not elapsedDays", () => {
    const card = makeCard({ interval: 60, lastReview: daysAgo(1) });
    expect(deriveFsrsState(card, NOW).stability).toBe(60);
  });

  it("uses interval as stability at the exact boundary", () => {
    const card = makeCard({ interval: 10, lastReview: daysAgo(10) });
    expect(deriveFsrsState(card, NOW).stability).toBe(10);
  });
});

describe("deriveFsrsState — stale card (elapsedDays > interval)", () => {
  it("uses elapsedDays for an overdue card", () => {
    const card = makeCard({ interval: 30, lastReview: daysAgo(90) });
    expect(deriveFsrsState(card, NOW).stability).toBe(90);
  });

  it("floors stability at 1 for a same-day-lapsed zero-interval card", () => {
    const card = makeCard({ interval: 0, lastReview: daysAgo(0) });
    expect(deriveFsrsState(card, NOW).stability).toBeGreaterThanOrEqual(1);
  });
});

describe("deriveFsrsState — missing lastReview", () => {
  it("treats elapsedDays as 0 and floors zero interval at 1", () => {
    const card = makeCard({ interval: 0, lastReview: undefined });
    expect(deriveFsrsState(card, NOW).stability).toBeGreaterThanOrEqual(1);
  });
});

describe("deriveFsrsState — difficulty derivation from ease", () => {
  it("maps ease=1.3 to difficulty=10", () => {
    expect(deriveFsrsState(makeCard({ ease: 1.3 }), NOW).difficulty).toBe(10);
  });

  it("maps ease=2.5 to difficulty=1", () => {
    expect(deriveFsrsState(makeCard({ ease: 2.5 }), NOW).difficulty).toBe(1);
  });

  it("clamps difficulty to [1,10] outside the nominal ease range", () => {
    const high = deriveFsrsState(makeCard({ ease: 3.5 }), NOW);
    const low = deriveFsrsState(makeCard({ ease: 0.5 }), NOW);
    expect(high.difficulty).toBeGreaterThanOrEqual(1);
    expect(high.difficulty).toBeLessThanOrEqual(10);
    expect(low.difficulty).toBeGreaterThanOrEqual(1);
    expect(low.difficulty).toBeLessThanOrEqual(10);
  });
});

describe("deriveFsrsState — property sweep", () => {
  it("matches the healthy/overdue branch across a spread of inputs", () => {
    for (let interval = 0; interval <= 400; interval += 17) {
      for (let elapsedDays = 0; elapsedDays <= 400; elapsedDays += 23) {
        const card = makeCard({
          interval,
          lastReview: new Date(NOW.getTime() - elapsedDays * DAY_MS).toISOString(),
        });
        const result = deriveFsrsState(card, NOW);
        expect(result.stability).toBeGreaterThanOrEqual(1);
        if (elapsedDays <= interval) {
          expect(result.stability).toBe(Math.max(1, interval));
        } else {
          expect(result.stability).toBe(Math.max(1, Math.round(elapsedDays)));
        }
      }
    }
  });
});

describe("deriveFsrsState — purity", () => {
  it("does not mutate the input card", () => {
    const card = makeCard();
    const snapshot = { ...card };
    deriveFsrsState(card, NOW);
    expect(card).toEqual(snapshot);
  });
});
