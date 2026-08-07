import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../../cost-estimate";
import { collectMandatory } from "../candidates";
import {
  assertMandatoryOwnership,
  buildMandatoryLoadBreakdown,
} from "../mandatory-load";
import { PROFILES } from "../profiles";
import { createInitialWorld, type SimulationOptions } from "../state";
import type { LearningItem } from "../../verification/types";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const options: SimulationOptions = {
  days: 180,
  corpusSize: 4,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

function fsrs(
  dueAt: string,
  state: "New" | "Learning" | "Review" | "Relearning" = "Review",
): LearningItem["schedule"] {
  return { kind: "fsrs", dueAt, stability: 30, difficulty: 5, state };
}

describe("Task 8.9f — assertMandatoryOwnership (test A/B ownership base)", () => {
  it("no lanza cuando cada itemId aparece en un único tranche", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const words = [...world.words.values()];
    words[0].meaning.schedule = fsrs("2026-08-19T10:00:00.000Z", "Learning");
    words[1].meaning.schedule = fsrs("2026-08-19T10:00:00.000Z");
    words[2].meaning.schedule = fsrs("2026-08-20T20:00:00.000Z");
    const mandatory = collectMandatory(world, NOW);
    expect(() => assertMandatoryOwnership(mandatory)).not.toThrow();
  });

  it("test A — un scheduled-review que pasa a overdue existe una sola vez, nunca en dos tranches", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    // Estado "dueToday" un día, y al día siguiente el mismo item pasa a
    // overdue: collectMandatory se re-deriva del schedule real, así que el
    // mismo itemId sólo puede estar en un tranche a la vez.
    word.meaning.schedule = fsrs("2026-08-19T10:00:00.000Z");
    const dayOne = collectMandatory(world, new Date("2026-08-19T20:00:00.000Z"));
    expect(dayOne.dueToday.map((item) => item.itemId)).toEqual([word.meaning.id]);
    expect(dayOne.overdue).toEqual([]);

    const dayTwo = collectMandatory(world, new Date("2026-08-20T20:00:00.000Z"));
    expect(dayTwo.overdue.map((item) => item.itemId)).toEqual([word.meaning.id]);
    expect(dayTwo.dueToday).toEqual([]);
    expect(() => assertMandatoryOwnership(dayTwo)).not.toThrow();
  });

  it("lanza cuando un itemId se inyecta artificialmente en dos tranches (regresión de ownership)", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.meaning.schedule = fsrs("2026-08-19T10:00:00.000Z");
    const mandatory = collectMandatory(world, NOW);
    // Simula un bug de scheduling: el mismo itemId también aparece en learning.
    const corrupted = {
      ...mandatory,
      learning: [{ ...mandatory.overdue[0] }],
    };
    expect(() => assertMandatoryOwnership(corrupted)).toThrow(/ownership violation/);
  });
});

describe("Task 8.9f — buildMandatoryLoadBreakdown (test F)", () => {
  it("test F — la suma de las fuentes es exactamente igual a totalMandatorySeconds", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const words = [...world.words.values()];
    words[0].meaning.schedule = fsrs("2026-08-19T10:00:00.000Z", "Learning");
    words[1].meaning.schedule = fsrs("2026-08-19T10:00:00.000Z");
    words[2].meaning.schedule = fsrs("2026-08-20T20:00:00.000Z");
    words[3].meaning.schedule = {
      kind: "provisional",
      dueAt: "2026-08-20T10:00:00.000Z",
      source: "direct",
      evidenceConfidence: 1,
    };
    const mandatory = collectMandatory(world, NOW);

    const { breakdown, counts } = buildMandatoryLoadBreakdown(
      mandatory,
      new Set(),
      DEFAULT_SECONDS_BY_MODALITY,
    );

    expect(breakdown.scheduledReviewSeconds
      + breakdown.overdueReviewSeconds
      + breakdown.learningStepSeconds
      + breakdown.provisionalDueSeconds
      + breakdown.otherMandatorySeconds).toBe(breakdown.totalMandatorySeconds);
    expect(breakdown.otherMandatorySeconds).toBe(0);
    expect(counts.scheduledReviews + counts.overdueReviews + counts.learningSteps + counts.provisionalDue)
      .toBe(4);
  });

  it("carriedMandatorySeconds es un overlay informativo, no se suma dos veces al total", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.meaning.schedule = fsrs("2026-08-20T20:00:00.000Z");
    const mandatory = collectMandatory(world, NOW);

    const withoutCarry = buildMandatoryLoadBreakdown(mandatory, new Set(), DEFAULT_SECONDS_BY_MODALITY);
    const withCarry = buildMandatoryLoadBreakdown(
      mandatory,
      new Set([word.meaning.id]),
      DEFAULT_SECONDS_BY_MODALITY,
    );

    expect(withCarry.breakdown.totalMandatorySeconds).toBe(withoutCarry.breakdown.totalMandatorySeconds);
    expect(withCarry.breakdown.carriedMandatorySeconds).toBe(DEFAULT_SECONDS_BY_MODALITY.recognition);
    expect(withoutCarry.breakdown.carriedMandatorySeconds).toBe(0);
  });
});
