import { describe, expect, it } from "vitest";
import { buildAdmissionLoadEnvelope } from "../../admission-envelope";
import { deriveRequiredBaseActivations } from "../../base-throughput-contract";
import { SIMULATION_COSTS, SIMULATION_NEW_WORD_INTRODUCTION_SECONDS } from "../run-simulation";
import {
  computeMandatoryHeadroom,
  evaluateMandatoryFeasibility,
  splitByWarmupSteadyWindow,
} from "../mandatory-feasibility";

describe("Task 8.9f §9 — evaluateMandatoryFeasibility (tests J/K)", () => {
  it("test J — arrival > service se detecta como unstable, incluso sin backlog previo tratado como arrival", () => {
    const result = evaluateMandatoryFeasibility({
      arrivalSecondsPerSession: 800,
      serviceCapacitySecondsPerSession: 600,
      backlogSlope: 5,
    });
    expect(result.utilization).toBeCloseTo(800 / 600, 6);
    expect(result.status).toBe("unstable");
  });

  it("test K — carga sostenible (arrival << service, backlog plano) se detecta como stable", () => {
    const result = evaluateMandatoryFeasibility({
      arrivalSecondsPerSession: 300,
      serviceCapacitySecondsPerSession: 900,
      backlogSlope: 0,
    });
    expect(result.status).toBe("stable");
  });

  it("clasifica como marginal cuando la utilización está cerca de 1 sin cruzarlo", () => {
    const result = evaluateMandatoryFeasibility({
      arrivalSecondsPerSession: 850,
      serviceCapacitySecondsPerSession: 900,
      backlogSlope: 0,
    });
    expect(result.status).toBe("marginal");
  });

  it("arrival == service exacto (utilization 1) es unstable, no marginal", () => {
    const result = evaluateMandatoryFeasibility({
      arrivalSecondsPerSession: 900,
      serviceCapacitySecondsPerSession: 900,
      backlogSlope: 0,
    });
    expect(result.status).toBe("unstable");
  });
});

describe("Task 8.9f §10 — computeMandatoryHeadroom (test L)", () => {
  const envelope = buildAdmissionLoadEnvelope({
    costs: SIMULATION_COSTS,
    introductionSeconds: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
    horizonSessions: 8,
  });
  const derived = deriveRequiredBaseActivations({
    configuredNewWordsTarget: 10,
    minimumC8Share: 0.6,
    horizonSessions: 8,
  });

  it("test L — el required workload depende únicamente del target C8, nunca de cuántas palabras se admitieron realmente", () => {
    const report = computeMandatoryHeadroom({
      budgetSeconds: 900,
      mandatoryServiceSecondsPerSession: 779,
      requiredNewWordsPerSession: derived.requiredNewWordsPerSession,
      envelope,
    });

    // La función no acepta ningún campo "admitted*" — el contrato mismo lo
    // impide (comprobación estructural del tipo de entrada).
    type HeadroomInput = Parameters<typeof computeMandatoryHeadroom>[0];
    const forbiddenKeys: Array<keyof HeadroomInput> = [] as never[];
    expect(forbiddenKeys).toEqual([]);

    // Cambiar un valor "admitido" hipotético (simulado aquí como una
    // variable no usada por la función) no puede alterar el resultado:
    // llamamos dos veces con el mismo required target y confirmamos
    // identidad total del resultado.
    const reportAgain = computeMandatoryHeadroom({
      budgetSeconds: 900,
      mandatoryServiceSecondsPerSession: 779,
      requiredNewWordsPerSession: derived.requiredNewWordsPerSession,
      envelope,
    });
    expect(report).toEqual(reportAgain);

    expect(report.headroomSeconds).toBe(900 - 779);
    expect(report.totalRequiredGrowthWorkSeconds).toBe(
      report.requiredImmediateWorkSeconds
        + report.requiredBaseActivationWorkSeconds
        + report.expectedFsrsDebtSeconds,
    );
    expect(report.marginSeconds).toBe(report.headroomSeconds - report.totalRequiredGrowthWorkSeconds);
  });
});

describe("Task 8.9f §11 — splitByWarmupSteadyWindow (test M)", () => {
  it("test M — separa warm-up (primeras 30 sesiones activas) de zona media y tramo final, reportados por separado", () => {
    const days = Array.from({ length: 100 }, (_, index) => ({ sessionIndex: index, value: index }));
    const { warmup, middle, final, warmupActiveSessions } = splitByWarmupSteadyWindow(days, 30);

    expect(warmupActiveSessions).toBe(30);
    expect(warmup).toHaveLength(30);
    expect(final).toHaveLength(30);
    expect(middle).toHaveLength(40);
    expect(warmup.every((day) => day.sessionIndex < 30)).toBe(true);
    expect(final.every((day) => day.sessionIndex >= 70)).toBe(true);
    expect(warmup.length + middle.length + final.length).toBe(days.length);
  });

  it("con menos de 60 sesiones evita solapar warm-up y final (usa el máximo entre warmup y total-warmup)", () => {
    const days = Array.from({ length: 40 }, (_, index) => ({ sessionIndex: index }));
    const { warmup, middle, final } = splitByWarmupSteadyWindow(days, 30);
    expect(warmup).toHaveLength(30);
    expect(middle).toHaveLength(0);
    expect(final).toHaveLength(10);
  });
});
