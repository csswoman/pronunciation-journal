import { describe, expect, it } from "vitest";
import {
  assertNoNegativeReservations,
  capacityWorkKey,
  dedupeCapacityWork,
  type CapacityWorkItem,
} from "../capacity-work";

describe("capacity work ownership", () => {
  it("N: no existe doble ownership del mismo work item", () => {
    const items: CapacityWorkItem[] = [
      {
        itemId: "c1k:a#meaning",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 12,
        sessionOffset: 2,
      },
      {
        itemId: "c1k:a#meaning",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 12,
        sessionOffset: 3,
      },
      {
        itemId: "c1k:a#listening",
        workKind: "pending-base",
        skill: "listening",
        estimatedSeconds: 20,
        sessionOffset: 1,
      },
    ];

    const deduped = dedupeCapacityWork(items);
    expect(deduped).toHaveLength(2);
    expect(capacityWorkKey(items[0])).toBe("c1k:a#meaning:scheduled-review");
  });

  it("D: review conocida no se mezcla con admission-future-review del mismo item", () => {
    const items: CapacityWorkItem[] = [
      {
        itemId: "c1k:a#meaning",
        workKind: "scheduled-review",
        skill: "meaning",
        estimatedSeconds: 12,
        sessionOffset: 8,
      },
      {
        itemId: "c1k:a#meaning",
        workKind: "admission-future-review",
        skill: "meaning",
        estimatedSeconds: 12,
        sessionOffset: 8,
      },
    ];
    const deduped = dedupeCapacityWork(items);
    expect(deduped.map((item) => item.workKind)).toEqual(["scheduled-review"]);
  });

  it("M: ninguna reserva tiene segundos negativos", () => {
    expect(() => assertNoNegativeReservations([
      {
        itemId: "x",
        workKind: "pending-base",
        skill: "listening",
        estimatedSeconds: -1,
        sessionOffset: 1,
      },
    ])).toThrow(/negative/i);
  });
});
