import { describe, expect, it } from "vitest";
import {
  buildAdmissionLoadEnvelope,
  totalExpectedReviewSeconds,
} from "../admission-envelope";
import {
  computeRequiredArrivalSecondsPerSession,
  computeThroughputRates,
  envelopeSecondsPerNewWord,
} from "../throughput-rates";
import { isC8Applicable } from "../criterion-applicability";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

describe("Task 8.9c throughput rates", () => {
  const envelope = buildAdmissionLoadEnvelope({
    costs,
    introductionSeconds: 10,
    horizonSessions: 8,
  });

  it("A: required arrival se deriva de target C8, no de admitted words", () => {
    const required = computeRequiredArrivalSecondsPerSession({
      targetNewWordsPerSession: 10,
      minimumC8Share: 0.6,
      envelope,
      c8Applicable: true,
    });
    const withLowActual = computeThroughputRates({
      actualAdmittedNewWordsPerSession: 1,
      requiredArrivalSecondsPerSession: required,
      sustainableServiceSecondsPerSession: 900,
      secondsPerActualNewWord: envelopeSecondsPerNewWord(envelope),
    });
    expect(withLowActual.requiredArrivalSecondsPerSession).toBe(required);
    expect(withLowActual.actualArrivalSecondsPerSession).toBe(
      1 * envelopeSecondsPerNewWord(envelope),
    );
    expect(withLowActual.requiredArrivalSecondsPerSession)
      .toBeGreaterThan(withLowActual.actualArrivalSecondsPerSession);
  });

  it("B: target=10, share=0.60 y envelope vigente → demanda derivada", () => {
    const perWord = envelopeSecondsPerNewWord(envelope);
    expect(perWord).toBe(
      envelope.immediateSeconds
      + envelope.baseActivationSeconds
      + totalExpectedReviewSeconds(envelope),
    );
    expect(perWord).toBe(79);
    const required = computeRequiredArrivalSecondsPerSession({
      targetNewWordsPerSession: 10,
      minimumC8Share: 0.6,
      envelope,
      c8Applicable: true,
    });
    expect(required).toBe(6 * perWord);
  });

  it("C8 solo aplica al perfil constante (steady)", () => {
    expect(isC8Applicable("steady")).toBe(true);
    expect(isC8Applicable("intermittent")).toBe(false);
    expect(isC8Applicable("bursty")).toBe(false);
    expect(isC8Applicable("beginner")).toBe(false);
    expect(isC8Applicable("advanced")).toBe(false);
  });

  it("required arrival es 0 cuando C8 no aplica", () => {
    expect(computeRequiredArrivalSecondsPerSession({
      targetNewWordsPerSession: 10,
      minimumC8Share: 0.6,
      envelope,
      c8Applicable: false,
    })).toBe(0);
  });
});
