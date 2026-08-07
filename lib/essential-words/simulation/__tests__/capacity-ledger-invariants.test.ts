import { describe, expect, it } from "vitest";
import { emptyLoadBreakdown } from "../../planning-load";
import type { CapacityReservation, DailyPlan } from "../../planning-types";
import { updateSimulationCapacityReservations } from "../capacity-state";
import type { SimulationWorld } from "../state";

function reservation(
  overrides: Partial<CapacityReservation> & Pick<CapacityReservation, "itemId">,
): CapacityReservation {
  return {
    source: "new-word",
    skill: "listening",
    deadlineSession: 3,
    estimatedSeconds: 20,
    ...overrides,
  };
}

function planWith(reservations: CapacityReservation[]): DailyPlan {
  return {
    allowance: {
      newWords: 0,
      capacitySafeNewWords: 0,
      baseSkillActivations: 0,
      usageActivations: 0,
      newWordMeaningActivations: 0,
      totalSkillActivations: 0,
      plannedSeconds: 0,
      mode: "normal",
    },
    mandatorySelected: [],
    deferredMandatory: [],
    baseSkillSelected: [],
    usageSelected: [],
    newWordsSelected: [],
    placementSelected: [],
    placementDeferred: 0,
    futureReservations: reservations,
    loadBreakdown: emptyLoadBreakdown(),
  };
}

describe("ledger reservation debt", () => {
  it("A: completar una reserva elimina su deuda futura", () => {
    const world = {
      futureReservations: [reservation({ itemId: "c1k:a#listening", deadlineSession: 2 })],
    } as SimulationWorld;
    updateSimulationCapacityReservations(
      world,
      planWith([reservation({ itemId: "c1k:a#listening", deadlineSession: 2 })]),
      new Set(["c1k:a#listening"]),
    );
    expect(world.futureReservations).toEqual([]);
  });

  it("B: una reserva ausente del plan pero aún pendiente se conserva", () => {
    const world = {
      words: new Map([
        ["c1k:debt", { introducedAt: "2026-08-01T00:00:00.000Z" }],
        ["c1k:ok", { introducedAt: "2026-08-01T00:00:00.000Z" }],
      ]),
      futureReservations: [
        reservation({ itemId: "c1k:debt#listening", deadlineSession: 2 }),
        reservation({ itemId: "c1k:ok#production", skill: "production", deadlineSession: 4 }),
      ],
    } as unknown as SimulationWorld;

    updateSimulationCapacityReservations(
      world,
      planWith([
        reservation({ itemId: "c1k:ok#production", skill: "production", deadlineSession: 3 }),
      ]),
      new Set(),
    );

    const ids = world.futureReservations.map((item) => item.itemId).sort();
    expect(ids).toEqual(["c1k:debt#listening", "c1k:ok#production"]);
    expect(world.futureReservations.find((item) => item.itemId === "c1k:debt#listening"))
      .toMatchObject({ deadlineSession: 2 });
    expect(world.futureReservations.find((item) => item.itemId === "c1k:ok#production"))
      .toMatchObject({ deadlineSession: 3 });
  });

  it("no duplica la misma deuda itemId:skill", () => {
    const world = {
      words: new Map([
        ["c1k:same", { introducedAt: "2026-08-01T00:00:00.000Z" }],
      ]),
      futureReservations: [
        reservation({ itemId: "c1k:same#listening", deadlineSession: 5 }),
      ],
    } as unknown as SimulationWorld;

    updateSimulationCapacityReservations(
      world,
      planWith([
        reservation({ itemId: "c1k:same#listening", deadlineSession: 2 }),
      ]),
      new Set(),
    );

    expect(world.futureReservations).toHaveLength(1);
    expect(world.futureReservations[0].deadlineSession).toBe(2);
  });
});
