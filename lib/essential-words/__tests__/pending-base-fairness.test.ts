import { describe, expect, it } from "vitest";
import {
  C9_BASE_ACTIVATION_LIMIT,
  comparePendingBaseCandidates,
  diagnoseBaseBlocking,
  rankPendingBaseCandidates,
  serviceUrgency,
  type PendingBaseCandidate,
} from "../pending-base-fairness";

function candidate(
  overrides: Partial<PendingBaseCandidate> & Pick<PendingBaseCandidate, "itemId" | "skill">,
): PendingBaseCandidate {
  return {
    wordId: overrides.wordId ?? overrides.itemId.split("#")[0]!.replace("c1k:", "c1k:"),
    modality: overrides.skill === "production" ? "production" : "listening",
    source: "pending-base",
    waitSessions: 0,
    firstEligibleSession: 0,
    admittedSession: 0,
    deadlineSession: C9_BASE_ACTIVATION_LIMIT,
    ...overrides,
  };
}

describe("pending-base fairness", () => {
  it("F: wait=7 gana prioridad sobre wait=1 salvo mandatory", () => {
    const aged = candidate({
      itemId: "c1k:old#listening",
      skill: "listening",
      waitSessions: 7,
      deadlineSession: 1,
    });
    const fresh = candidate({
      itemId: "c1k:new#listening",
      skill: "listening",
      waitSessions: 1,
      deadlineSession: 7,
    });
    expect(comparePendingBaseCandidates(aged, fresh)).toBeLessThan(0);
    expect(rankPendingBaseCandidates([fresh, aged]).map((item) => item.itemId))
      .toEqual(["c1k:old#listening", "c1k:new#listening"]);
  });

  it("G: producción envejecida no queda detrás de listening nuevo indefinidamente", () => {
    const agedProduction = candidate({
      itemId: "c1k:p#production",
      skill: "production",
      waitSessions: 6,
      deadlineSession: 2,
    });
    const freshListening = candidate({
      itemId: "c1k:l#listening",
      skill: "listening",
      waitSessions: 0,
      deadlineSession: 8,
    });
    expect(comparePendingBaseCandidates(agedProduction, freshListening)).toBeLessThan(0);
  });

  it("H: listening envejecido no queda detrás de production nuevo", () => {
    const agedListening = candidate({
      itemId: "c1k:l#listening",
      skill: "listening",
      waitSessions: 6,
      deadlineSession: 2,
    });
    const freshProduction = candidate({
      itemId: "c1k:p#production",
      skill: "production",
      waitSessions: 0,
      deadlineSession: 8,
    });
    expect(comparePendingBaseCandidates(agedListening, freshProduction)).toBeLessThan(0);
  });

  it("I: desempates son deterministas", () => {
    const a = candidate({
      itemId: "c1k:a#listening",
      skill: "listening",
      waitSessions: 3,
      deadlineSession: 5,
    });
    const b = candidate({
      itemId: "c1k:b#listening",
      skill: "listening",
      waitSessions: 3,
      deadlineSession: 5,
    });
    expect(comparePendingBaseCandidates(a, b)).toBe(
      comparePendingBaseCandidates(a, b),
    );
    expect(rankPendingBaseCandidates([b, a]).map((item) => item.itemId))
      .toEqual(rankPendingBaseCandidates([a, b]).map((item) => item.itemId));
  });

  it("serviceUrgency crece al acercarse al límite C9", () => {
    expect(serviceUrgency(7, 1)).toBeGreaterThan(serviceUrgency(1, 7));
    expect(serviceUrgency(0, 8)).toBeLessThan(serviceUrgency(4, 4));
  });

  it("M: sin capacidad el diagnóstico no finge fairness", () => {
    const reason = diagnoseBaseBlocking({
      candidate: candidate({ itemId: "c1k:x#listening", skill: "listening", waitSessions: 7 }),
      remainingBudgetSeconds: 0,
      remainingBaseSlots: 2,
      selectedItemIds: new Set(),
      hardMandatoryRemainingSeconds: 100,
      placementReservationSeconds: 0,
      usageReservationSeconds: 0,
    });
    expect(reason).toBe("no-session-capacity");
  });

  it("K: capacity de mandatory bloquea antes que fairness", () => {
    const reason = diagnoseBaseBlocking({
      candidate: candidate({
        itemId: "c1k:x#listening",
        skill: "listening",
        waitSessions: 7,
      }),
      remainingBudgetSeconds: 50,
      remainingBaseSlots: 2,
      selectedItemIds: new Set(),
      hardMandatoryRemainingSeconds: 50,
      placementReservationSeconds: 0,
      usageReservationSeconds: 0,
      candidateCostSeconds: 20,
    });
    expect(reason).toBe("mandatory-capacity");
  });

  it("base-throughput-cap se diagnostica cuando no hay slots", () => {
    expect(diagnoseBaseBlocking({
      candidate: candidate({ itemId: "c1k:x#listening", skill: "listening" }),
      remainingBudgetSeconds: 100,
      remainingBaseSlots: 0,
      selectedItemIds: new Set(),
      hardMandatoryRemainingSeconds: 0,
      placementReservationSeconds: 0,
      usageReservationSeconds: 0,
      candidateCostSeconds: 20,
    })).toBe("base-throughput-cap");
  });
});
