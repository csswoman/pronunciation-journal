import { describe, expect, it } from "vitest";
import { computeLearningStepAmplification } from "../learning-step-amplification";
import { runMandatoryAudit } from "../mandatory-audit";
import { SIMULATION_COSTS } from "../run-simulation";
import { PROFILES } from "../profiles";
import type { SimulationOptions } from "../state";

describe("Task 8.9f §5 — computeLearningStepAmplification", () => {
  const options: SimulationOptions = {
    days: 120,
    corpusSize: 300,
    seed: 42,
    startAt: "2026-08-01T00:00:00.000Z",
    dailyBudgetSeconds: 900,
    targetNewWords: 10,
  };

  it("mide learning steps por palabra nueva y por lapso sin modificar FSRS", () => {
    const audit = runMandatoryAudit(PROFILES.beginner, options);
    const amplification = computeLearningStepAmplification(audit.simulation, SIMULATION_COSTS);

    expect(amplification.introducedWords).toBeGreaterThan(0);
    expect(amplification.learningStepsTotal).toBe(
      amplification.learningStepsFromNewWord
        + amplification.learningStepsFromLapse
        + amplification.learningStepsOther,
    );
    expect(amplification.learningStepsCreatedPerNewWord).toBeGreaterThanOrEqual(0);
    expect(amplification.learningStepsCreatedPerLapse).toBeGreaterThanOrEqual(0);
    expect(amplification.learningStepSecondsPerNewWord).toBeGreaterThanOrEqual(0);
  });
});
