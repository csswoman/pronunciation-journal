import { describe, expect, it } from "vitest";
import {
  buildAdmissionLoadEnvelope,
} from "../admission-envelope";
import { admitNewWords } from "../admission-control";
import { buildCapacityForecast } from "../capacity-forecast";
import { applyExpectedFsrsReserve } from "../hard-mandatory-forecast";
import type { ForecastSessionCapacity } from "../planning-types";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

function fullSessions(seconds = 900): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: seconds,
    listeningSeconds: seconds,
    productionSeconds: seconds,
  }));
}

describe("admission with hard future FSRS", () => {
  it("A: review FSRS dentro de 8 sesiones reduce capacitySafeNewWords", () => {
    const candidates = Array.from({ length: 20 }, (_, index) => ({
      wordId: `w${index}`,
      rank: index,
    }));
    const without = admitNewWords({
      candidates,
      configuredNewWordLimit: 20,
      forecast: buildCapacityForecast({
        sessions: fullSessions(90),
        mandatory: [],
        pendingBase: [],
        futureReservations: [],
      }),
      estimatedSecondsByModality: costs,
    });

    const withReviews = admitNewWords({
      candidates,
      configuredNewWordLimit: 20,
      forecast: buildCapacityForecast({
        sessions: fullSessions(90),
        mandatory: [{
          itemId: "c1k:due#meaning",
          skill: "meaning",
          deadlineSession: 1,
          estimatedSeconds: 60,
        }],
        pendingBase: [],
        futureReservations: [],
      }),
      estimatedSecondsByModality: costs,
      admissionEnvelope: buildAdmissionLoadEnvelope({
        costs,
        introductionSeconds: 10,
        horizonSessions: 8,
      }),
    });

    expect(withReviews.capacitySafeNewWords).toBeLessThan(without.capacitySafeNewWords);
  });

  it("E/H: envelope consume residual; al liberar presión vuelve capacidad", () => {
    const envelope = buildAdmissionLoadEnvelope({
      costs,
      introductionSeconds: 10,
      horizonSessions: 8,
    });
    const candidates = [
      { wordId: "a", rank: 1 },
      { wordId: "b", rank: 2 },
      { wordId: "c", rank: 3 },
      { wordId: "d", rank: 4 },
    ];
    const pressure = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      forecast: buildCapacityForecast({
        sessions: applyExpectedFsrsReserve(
          fullSessions(55),
          // Pre-load heavy FSRS debt on every session
          [40, 40, 40, 40, 40, 40, 40, 40],
        ),
        mandatory: [],
        pendingBase: [],
        futureReservations: [],
      }),
      estimatedSecondsByModality: costs,
      admissionEnvelope: envelope,
    });

    const roomy = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      forecast: buildCapacityForecast({
        sessions: fullSessions(900),
        mandatory: [],
        pendingBase: [],
        futureReservations: [],
      }),
      estimatedSecondsByModality: costs,
      admissionEnvelope: envelope,
    });

    expect(pressure.capacitySafeNewWords).toBeLessThan(roomy.capacitySafeNewWords);
    expect(roomy.capacitySafeNewWords).toBeGreaterThanOrEqual(2);
  });
});
