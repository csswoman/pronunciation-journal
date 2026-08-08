import { describe, expect, it } from "vitest";
import { admitNewWords } from "../admission-control";
import {
  consumeBaseObligationCapacity,
  deriveBaseBackpressure,
  type BaseBackpressure,
  type BaseServiceSample,
} from "../base-backpressure";
import { deriveBaseBacklogPolicy } from "../pending-base-fairness";
import type { NewWordCandidate } from "../planning-types";
import { admit, costs, inferred } from "../placement/__tests__/capacity-reservations.fixtures";

const words: NewWordCandidate[] = Array.from({ length: 10 }, (_, index) => ({
  wordId: `c1k:new-${index}`,
  rank: index,
}));
const backlogPolicy = deriveBaseBacklogPolicy({
  dailyBudgetSeconds: 900,
  modalityCosts: costs,
});

function history(served: number, opportunity = true): BaseServiceSample[] {
  return Array.from({ length: 8 }, () => ({
    servedBaseActivations: served,
    serviceOpportunity: opportunity,
  }));
}

function pressure(availableObligationCapacity: number): BaseBackpressure {
  return {
    pendingBaseCount: 0,
    recentServiceRate: 4,
    serviceCapacityWithinC9: availableObligationCapacity,
    availableObligationCapacity,
    status: availableObligationCapacity > 0 ? "open" : "closed",
  };
}

describe("backpressure por throughput base reciente", () => {
  it("M: backlog bajo y throughput alto mantienen admission abierta", () => {
    const result = deriveBaseBackpressure({
      pendingBaseCount: 2,
      recentService: history(4),
      remainingSecondsAfterMandatory: 0,
      modalityCosts: costs,
    });

    expect(result).toMatchObject({
      recentServiceRate: 4,
      serviceCapacityWithinC9: 32,
      availableObligationCapacity: 30,
      status: "constrained",
    });
  });

  it("N/O: backlog alto cierra admission y al drenarse vuelve a abrir", () => {
    const closed = deriveBaseBackpressure({
      pendingBaseCount: 8,
      recentService: history(1),
      remainingSecondsAfterMandatory: 0,
      modalityCosts: costs,
    });
    const reopened = deriveBaseBackpressure({
      pendingBaseCount: 0,
      recentService: history(1),
      remainingSecondsAfterMandatory: 0,
      modalityCosts: costs,
    });

    expect(closed).toMatchObject({ availableObligationCapacity: 0, status: "closed" });
    expect(reopened).toMatchObject({ availableObligationCapacity: 8, status: "open" });
  });

  it("P/Q/R: new words y placement consumen una capacidad compartida por obligación real", () => {
    const shared = pressure(4);
    const placement = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 10,
      remainingSeconds: 900,
      baseBackpressure: shared,
    });
    expect(placement.admitted).toHaveLength(2);
    expect(placement.newReservations).toHaveLength(4);

    const afterPlacement = consumeBaseObligationCapacity(
      shared,
      placement.newReservations.length,
    );
    const newWords = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: 20,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy,
      baseBackpressure: afterPlacement,
    });
    expect(newWords.admitted).toHaveLength(0);

    const twoObligations = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 1,
      remainingSeconds: 900,
      perNewWordSeconds: 20,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy,
      baseBackpressure: pressure(2),
    });
    expect(twoObligations.admitted).toHaveLength(1);
    expect(twoObligations.newReservations.map((item) => item.skill).sort())
      .toEqual(["listening", "production"]);
  });

  it("S: startup sin historial deriva capacidad de segundos y coste medio", () => {
    const result = deriveBaseBackpressure({
      pendingBaseCount: 0,
      recentService: [],
      remainingSecondsAfterMandatory: 76,
      modalityCosts: costs,
    });

    expect(result.recentServiceRate).toBe(4);
    expect(result.availableObligationCapacity).toBe(32);
    expect(result.status).toBe("open");
  });

  it("T/U: la misma historia/config es determinista y no recibe nombre de perfil", () => {
    const input = {
      pendingBaseCount: 3,
      recentService: history(2),
      remainingSecondsAfterMandatory: 500,
      modalityCosts: costs,
    };

    expect(deriveBaseBackpressure(input)).toEqual(deriveBaseBackpressure(input));
  });
});
