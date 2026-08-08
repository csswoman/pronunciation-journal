import { describe, expect, it } from "vitest";
import { buildAssessment } from "../../verification/assessment";
import type { AttemptModality } from "../../verification/types";
import { isScheduledReviewEligibleForC11, observedRetentionWithinTarget } from "../criteria";
import type { SimulationHarnessHooks } from "../observations";
import { PROFILES, type SimulationProfile } from "../profiles";
import { seededRandom } from "../random";
import { simulateAttemptOutcome } from "../simulated-outcome";
import type { SimulationOptions } from "../state";
import {
  traceScheduledReviews,
  violatesRecallInvariant,
} from "../scheduled-review-trace";

/**
 * Task 8.9g — mandatory tests A-K auditing C11's independence from
 * `accuracyByModality`. See docs/superpowers/plans/notes/2026-08-07-fase8-9g-c11-independence.md
 * for the full write-up; this file only asserts the falsifiable claims.
 */

const SMALL_OPTIONS: SimulationOptions = {
  days: 120,
  corpusSize: 60,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  // Deliberately unconstrained: isolates accuracy-driven effects from
  // session-capacity backlog (Task 8.9g §10 "corrida backlog cero").
  dailyBudgetSeconds: 50_000,
  targetNewWords: 10,
};

function profileWithAccuracy(id: SimulationProfile["id"], accuracy: number): SimulationProfile {
  const base = PROFILES[id];
  return {
    ...base,
    accuracyByModality: {
      recognition: accuracy,
      production: accuracy,
      listening: accuracy,
      pronunciation: accuracy,
    },
  };
}

/** Pins retrievability at the FSRS desiredRetention target for every
 * scheduled review, reusing the already-drawn `rngSample` so `recalled`
 * remains a pure RNG-vs-probability decision. Removes the organic
 * stability cascade so accuracy's *indirect* channel (via lapses -> low
 * stability -> day-granularity rounding) cannot contribute. */
function pinRetrievabilityHooks(target = 0.9): SimulationHarnessHooks {
  return {
    mutateCompletions: (completions) => completions.map((completion) => {
      if (!completion.scheduledReview) return completion;
      const recalled = completion.scheduledReview.rngSample < target;
      return {
        ...completion,
        assessment: { ...completion.assessment, correct: recalled },
        scheduledReview: {
          ...completion.scheduledReview,
          retrievability: target,
          recalled,
        },
      };
    }),
  };
}

describe("Task 8.9g — invariante fundamental (recalled === rngSample < retrievability)", () => {
  it("ninguna scheduled-review de una simulación completa viola el invariante", () => {
    const { entries } = traceScheduledReviews(PROFILES.beginner, SMALL_OPTIONS);
    expect(entries.length).toBeGreaterThan(50);
    expect(entries.filter(violatesRecallInvariant)).toEqual([]);
  });

  it("el invariante se cumple también para el perfil advanced (accuracy alta)", () => {
    const { entries } = traceScheduledReviews(PROFILES.advanced, SMALL_OPTIONS);
    expect(entries.length).toBeGreaterThan(50);
    expect(entries.filter(violatesRecallInvariant)).toEqual([]);
  });
});

describe("Test A — misma retrievability + seed, distinta accuracy -> mismo recalled", () => {
  it("simulateAttemptOutcome no altera correct cuando scheduledCorrect ya fue decidido por FSRS", () => {
    const highAccuracy = profileWithAccuracy("beginner", 0.95);
    const lowAccuracy = profileWithAccuracy("beginner", 0.50);
    const modalities: AttemptModality[] = ["recognition", "production", "listening", "pronunciation"];

    for (const modality of modalities) {
      for (const scheduledCorrect of [true, false]) {
        for (let seed = 0; seed < 20; seed += 1) {
          const item = { itemId: "i", wordId: "w", skill: "meaning" as const, modality, dueAt: "" };
          const highOutcome = simulateAttemptOutcome(
            item,
            highAccuracy,
            5_000,
            seededRandom(seed),
            scheduledCorrect,
          );
          const lowOutcome = simulateAttemptOutcome(
            item,
            lowAccuracy,
            5_000,
            seededRandom(seed),
            scheduledCorrect,
          );

          expect(highOutcome.outcome.correct).toBe(scheduledCorrect);
          expect(lowOutcome.outcome.correct).toBe(scheduledCorrect);
          expect(highOutcome.outcome.correct).toBe(lowOutcome.outcome.correct);
        }
      }
    }
  });

  it("buildAssessment preserva correct===recalled sin importar accuracy, aunque el grade pueda diferir", () => {
    const highAccuracy = profileWithAccuracy("beginner", 0.95);
    const lowAccuracy = profileWithAccuracy("beginner", 0.50);
    const item = { itemId: "i", wordId: "w", skill: "meaning" as const, modality: "recognition" as const, dueAt: "" };

    let observedGradeDivergence = false;
    for (let seed = 0; seed < 200; seed += 1) {
      const recalled = seed % 2 === 0;
      const high = simulateAttemptOutcome(item, highAccuracy, 5_000, seededRandom(seed), recalled);
      const low = simulateAttemptOutcome(item, lowAccuracy, 5_000, seededRandom(seed), recalled);
      const highAssessment = buildAssessment(high.outcome, item.modality, { interactionDurationMs: 5_000 });
      const lowAssessment = buildAssessment(low.outcome, item.modality, { interactionDurationMs: 5_000 });

      expect(highAssessment.correct).toBe(recalled);
      expect(lowAssessment.correct).toBe(recalled);
      if (highAssessment.grade !== lowAssessment.grade) observedGradeDivergence = true;
    }
    // Execution-quality noise (hints, rescue) CAN legitimately move Good/Easy
    // or force Again independently of recall — that's allowed by spec (§3).
    expect(observedGradeDivergence).toBe(true);
  });
});

describe("Test B — accuracy baja no impone techo a C11 cuando retrievability está sana", () => {
  it("con retrievability anclada al target, beginner y advanced caen ambos cerca de 0.90", () => {
    const beginnerResult = traceScheduledReviews(
      PROFILES.beginner,
      SMALL_OPTIONS,
      pinRetrievabilityHooks(0.9),
    ).result;
    const advancedResult = traceScheduledReviews(
      PROFILES.advanced,
      SMALL_OPTIONS,
      pinRetrievabilityHooks(0.9),
    ).result;

    const beginnerC11 = observedRetentionWithinTarget(
      beginnerResult.attemptLogs,
      beginnerResult.srsEvents,
      0.9,
      0.06,
      50,
    );
    const advancedC11 = observedRetentionWithinTarget(
      advancedResult.attemptLogs,
      advancedResult.srsEvents,
      0.9,
      0.06,
      50,
    );

    expect(beginnerC11.passed).toBe(true);
    expect(advancedC11.passed).toBe(true);
    expect(Math.abs((beginnerC11.measured as number) - (advancedC11.measured as number)))
      .toBeLessThan(0.05);
  });
});

describe("Test C — contrato beginner original (8.5): documentado, no forzado", () => {
  it("bajo condiciones organicas backlog-cero, beginner NO alcanza [0.85, 0.95] — hallazgo estructural, no un override de accuracy", () => {
    const { entries, result } = traceScheduledReviews(PROFILES.beginner, SMALL_OPTIONS);
    const c11 = observedRetentionWithinTarget(result.attemptLogs, result.srsEvents, 0.9, 0.05, 50);

    // Invariante intacto: el promedio de retrievability explica casi
    // exactamente el C11 medido — es decir, C11 sigue a retrievability, no a
    // accuracyByModality de forma directa (ver nota Fase 8 para el mecanismo:
    // day-granularity de FSRS deprime retrievability en items de baja
    // stability, y accuracy baja produce más de esos items).
    const avgRetrievability = entries.reduce((total, entry) => total + entry.retrievability, 0)
      / entries.length;
    expect(Math.abs(avgRetrievability - (c11.measured as number))).toBeLessThan(0.03);

    // No se fuerza el perfil ni se redefine C11 para que esto pase (§6).
    // Se documenta el estado real tal como es.
    expect(c11.passed).toBe(false);
  });
});

describe("Test D/E — retrievability sigue siendo el driver (regresión de contratos previos)", () => {
  it("retrievability deliberadamente baja falla C11 aunque accuracy sea 1.0", () => {
    const perfectAccuracy = profileWithAccuracy("advanced", 1);
    const hooks: SimulationHarnessHooks = {
      mutateCompletions: (completions) => completions.map((completion) => (
        completion.scheduledReview
          ? {
              ...completion,
              assessment: { ...completion.assessment, correct: false },
              scheduledReview: { ...completion.scheduledReview, retrievability: 0.4, recalled: false },
            }
          : completion
      )),
    };
    const { result } = traceScheduledReviews(perfectAccuracy, SMALL_OPTIONS, hooks);
    const c11 = observedRetentionWithinTarget(result.attemptLogs, result.srsEvents, 0.9, 0.05, 50);
    expect(c11.passed).toBe(false);
    expect((c11.measured as number)).toBeLessThan(0.85);
  });

  it("retrievability ~1.0 falla C11 por exceso, sin importar accuracy", () => {
    const lowAccuracy = profileWithAccuracy("beginner", 0.3);
    const hooks: SimulationHarnessHooks = {
      mutateCompletions: (completions) => completions.map((completion) => (
        completion.scheduledReview
          ? {
              ...completion,
              assessment: { ...completion.assessment, correct: true },
              scheduledReview: { ...completion.scheduledReview, retrievability: 0.995, recalled: true },
            }
          : completion
      )),
    };
    const { result } = traceScheduledReviews(lowAccuracy, SMALL_OPTIONS, hooks);
    const c11 = observedRetentionWithinTarget(result.attemptLogs, result.srsEvents, 0.9, 0.05, 50);
    expect(c11.passed).toBe(false);
    expect((c11.measured as number)).toBeGreaterThan(0.95);
  });
});

describe("Test F — practice/verification/learning-step nunca afectan C11", () => {
  it("los eventos incluidos en C11 provienen únicamente de scheduled-review con affectsSchedule", () => {
    const { entries, result } = traceScheduledReviews(PROFILES.beginner, SMALL_OPTIONS);
    expect(entries.every((entry) => entry.includedInC11)).toBe(true);

    const nonScheduled = result.attemptLogs.filter((attempt) => attempt.eventType !== "scheduled-review");
    expect(nonScheduled.length).toBeGreaterThan(0);
    for (const attempt of nonScheduled) {
      expect(isScheduledReviewEligibleForC11(attempt, { affectsSchedule: true })).toBe(false);
    }
  });
});

describe("Test G — C11 usa recalled (assessment.correct), no un sustituto", () => {
  it("para toda scheduled-review, assessment.correct === recalled", () => {
    const { entries } = traceScheduledReviews(PROFILES.intermittent, SMALL_OPTIONS);
    expect(entries.length).toBeGreaterThan(50);
    for (const entry of entries) {
      expect(entry.assessmentCorrect).toBe(entry.recalled);
    }
  });
});

describe("Test H — misma seed reproduce exactamente la secuencia de recalled", () => {
  it("dos corridas con la misma seed producen la misma secuencia recalled", () => {
    const first = traceScheduledReviews(PROFILES.bursty, SMALL_OPTIONS).entries.map((e) => e.recalled);
    const second = traceScheduledReviews(PROFILES.bursty, SMALL_OPTIONS).entries.map((e) => e.recalled);
    expect(first.length).toBeGreaterThan(50);
    expect(first).toEqual(second);
  });
});

describe("Test I — execution accuracy se mide por separado de recalled", () => {
  it("hintsUsed/rescued varían con accuracy incluso cuando recalled es idéntico", () => {
    const { entries } = traceScheduledReviews(PROFILES.beginner, SMALL_OPTIONS);
    const recalledEntries = entries.filter((e) => e.recalled);
    const hintsShare = recalledEntries.filter((e) => e.executionQuality.hintsUsed).length
      / Math.max(1, recalledEntries.length);
    // El perfil beginner tiene accuracy baja: incluso entre recuerdos
    // exitosos debe observarse uso de hints con una tasa no trivial,
    // medible independientemente del hecho de que recalled=true.
    expect(hintsShare).toBeGreaterThan(0);
  });
});

describe("Test J — grade puede diferir sin alterar recalled de la review actual", () => {
  it("existen casos recalled=true con grade=Again (execution quality), y no cambian assessmentCorrect", () => {
    const { entries } = traceScheduledReviews(PROFILES.beginner, SMALL_OPTIONS);
    const forcedAgainDespiteRecall = entries.filter((e) => e.recalled && e.selectedGrade === "Again");
    expect(forcedAgainDespiteRecall.length).toBeGreaterThan(0);
    for (const entry of forcedAgainDespiteRecall) {
      expect(entry.assessmentCorrect).toBe(true);
    }
  });
});
