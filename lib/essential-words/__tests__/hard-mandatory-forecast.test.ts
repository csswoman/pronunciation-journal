import { describe, expect, it } from "vitest";
import {
  applyMandatoryWithRollover,
  buildFutureCapacitySlots,
  reconcileCapacityLedger,
} from "../hard-mandatory-forecast";
import type { CapacityWorkItem } from "../capacity-work";
import type { ForecastSessionCapacity } from "../planning-types";

function sessions(seconds = 100): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: seconds,
    listeningSeconds: seconds,
    productionSeconds: seconds,
  }));
}

describe("hard mandatory forecast", () => {
  it("C: mandatory no completado hace rollover sin duplicarse", () => {
    const demands: CapacityWorkItem[] = [
      {
        itemId: "a#meaning",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 60,
        sessionOffset: 1,
      },
      {
        itemId: "b#meaning",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 60,
        sessionOffset: 1,
      },
      {
        itemId: "a#meaning",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 60,
        sessionOffset: 1,
      },
    ];

    const placed = applyMandatoryWithRollover(sessions(100), demands);
    const ids = placed.map((item) => `${item.itemId}@${item.sessionOffset}`);
    expect(ids.filter((id) => id.startsWith("a#meaning")).length).toBe(1);
    expect(placed.find((item) => item.itemId === "b#meaning")?.sessionOffset).toBe(2);
  });

  it("A: review FSRS dentro de 8 sesiones reduce residual para admission", () => {
    const slots = buildFutureCapacitySlots({
      sessions: sessions(900),
      mandatory: [{
        itemId: "c1k:x#meaning",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 200,
        sessionOffset: 2,
      }],
      base: [],
      placement: [],
      expectedFsrsBySession: [0, 0, 0, 0, 0, 0, 0, 0],
    });
    expect(slots[1].committedMandatorySeconds).toBe(200);
    expect(slots[1].residualSeconds).toBe(700);
    expect(slots[0].residualSeconds).toBe(900);
  });

  it("L: committed + expected + residual <= total", () => {
    const slots = buildFutureCapacitySlots({
      sessions: sessions(900),
      mandatory: [{
        itemId: "m",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 100,
        sessionOffset: 1,
      }],
      base: [{
        itemId: "b#listening",
        workKind: "pending-base",
        skill: "listening",
        estimatedSeconds: 40,
        sessionOffset: 1,
      }],
      placement: [],
      expectedFsrsBySession: [50, 0, 0, 0, 0, 0, 0, 0],
    });
    const check = reconcileCapacityLedger(slots);
    expect(check.ok).toBe(true);
    expect(slots[0].residualSeconds).toBe(710);
  });
});
