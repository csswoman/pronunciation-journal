import { describe, expect, it } from "vitest";
import { admitNewWords } from "../admission-control";
import { applyAdmissionThroughputCap } from "../admission-capacity";
import { buildAdmissionLoadEnvelope } from "../admission-envelope";
import { buildCapacityForecast } from "../capacity-forecast";
import type { ForecastSessionCapacity } from "../planning-types";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

function sessions(available: number): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: available,
    listeningSeconds: available,
    productionSeconds: available,
  }));
}

describe("N: liberar pending base recupera admission", () => {
  it("con margen target, menos pending-base aumenta capacitySafeNewWords", () => {
    const envelope = buildAdmissionLoadEnvelope({
      costs,
      introductionSeconds: 10,
      horizonSessions: 8,
    });
    const heavyPending = Array.from({ length: 20 }, (_, index) => ({
      itemId: `c1k:pending-${index}#listening`,
      source: "pending-base" as const,
      skill: "listening" as const,
      deadlineSession: 2,
      estimatedSeconds: 45,
    }));
    const pressed = buildCapacityForecast({
      sessions: sessions(90),
      mandatory: [],
      pendingBase: heavyPending,
      futureReservations: [],
    });
    const relieved = buildCapacityForecast({
      sessions: sessions(90),
      mandatory: [],
      pendingBase: heavyPending.slice(0, 1),
      futureReservations: [],
    });
    const candidates = Array.from({ length: 10 }, (_, index) => ({
      wordId: `c1k:new-${index}`,
      rank: index + 1,
    }));
    const pressedAdmission = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      forecast: applyAdmissionThroughputCap(pressed, 4, costs),
      estimatedSecondsByModality: costs,
      admissionEnvelope: envelope,
      introductionSeconds: 10,
    });
    const relievedAdmission = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      forecast: applyAdmissionThroughputCap(relieved, 4, costs),
      estimatedSecondsByModality: costs,
      admissionEnvelope: envelope,
      introductionSeconds: 10,
    });
    expect(pressedAdmission.capacitySafeNewWords).toBeLessThan(10);
    expect(relievedAdmission.capacitySafeNewWords)
      .toBeGreaterThan(pressedAdmission.capacitySafeNewWords);
  });
});
