import { describe, expect, it } from "vitest";
import {
  applyAdmissionThroughputCap,
  DEFAULT_ADMISSION_CAPACITY_POLICY,
} from "../admission-capacity";
import { buildCapacityForecast } from "../capacity-forecast";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

describe("applyAdmissionThroughputCap", () => {
  it("no permite reservar más work base por slot que el límite de activación", () => {
    const forecast = buildCapacityForecast({
      sessions: Array.from({ length: 8 }, (_, index) => ({
        sessionOffset: index + 1,
        availableSeconds: 900,
        listeningSeconds: 900,
        productionSeconds: 900,
      })),
      mandatory: [],
      pendingBase: [],
      futureReservations: [],
    });

    const capped = applyAdmissionThroughputCap(
      forecast,
      DEFAULT_ADMISSION_CAPACITY_POLICY.absoluteBaseActivationSafetyCeiling,
      costs,
    );

    for (const session of capped.sessions) {
      expect(session.availableSeconds)
        .toBeLessThanOrEqual(DEFAULT_ADMISSION_CAPACITY_POLICY.absoluteBaseActivationSafetyCeiling * 25);
      expect(session.listeningSeconds)
        .toBeLessThanOrEqual(DEFAULT_ADMISSION_CAPACITY_POLICY.absoluteBaseActivationSafetyCeiling * 20);
    }
  });
});
