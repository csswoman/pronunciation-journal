import { describe, expect, it } from "vitest";
import {
  ADMISSION_LOAD_ENVELOPE_VERSION,
  buildAdmissionLoadEnvelope,
} from "../admission-envelope";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

describe("AdmissionLoadEnvelope", () => {
  it("E: envelope reduce capacidad sin inventar dueAt exacto", () => {
    const envelope = buildAdmissionLoadEnvelope({
      costs,
      introductionSeconds: 10,
      horizonSessions: 8,
    });
    expect(envelope.version).toBe(ADMISSION_LOAD_ENVELOPE_VERSION);
    expect(envelope.provenance).toBe("simulation-model");
    expect(envelope.immediateSeconds).toBe(10 + 12);
    expect(envelope.baseActivationSeconds).toBe(20 + 25);
    expect(envelope.expectedReviewSecondsBySession).toHaveLength(8);
    expect(envelope.expectedReviewSecondsBySession.some((value) => value > 0)).toBe(true);
    expect(envelope).not.toHaveProperty("dueAt");
  });

  it("F: misma seed/policy produce mismo envelope", () => {
    const left = buildAdmissionLoadEnvelope({ costs, introductionSeconds: 10, horizonSessions: 8 });
    const right = buildAdmissionLoadEnvelope({ costs, introductionSeconds: 10, horizonSessions: 8 });
    expect(left).toEqual(right);
  });
});
