import { describe, expect, it } from "vitest";
import { planDailySession } from "../../daily-budget";
import type {
  ActivationLimits,
  DailyPlanningInput,
  PlanningLoadBreakdown,
} from "../../planning-types";
import { DEFAULT_RECOVERY_POLICY } from "../../recovery-mode";
import {
  backlogStable,
  budgetRespected,
  percentile95WithinBudget,
  recoveryExits,
} from "../../simulation/criteria";
import { PROFILES } from "../../simulation/profiles";
import { runSimulation } from "../../simulation/run-simulation";
import {
  convertInferences,
  DEFAULT_CONVERSIONS_PER_DAY,
} from "../policy";
import {
  activeDates,
  admit,
  costs,
  inferred,
  NOW,
  openSessions,
  readyForecast,
} from "./capacity-reservations.fixtures";

describe("admitPlacementConversions — distribución y simulación", () => {
  it("I: una cohorte grande distribuye provisionales de forma determinista", () => {
    const result = admit({
      candidates: inferred(40),
      maxConversionsPerSession: 40,
      forecast: readyForecast(openSessions(2_000)),
    });
    const days = new Set(result.admitted.map((item) => (
      item.schedule.kind === "provisional" ? item.schedule.dueAt.slice(0, 10) : ""
    )));

    expect(result.admitted.length).toBeGreaterThanOrEqual(20);
    expect(days.size).toBeGreaterThanOrEqual(7);
  });

  it("J: misma seed/contexto produce exactamente las mismas conversiones y ventanas", () => {
    const first = admit({
      candidates: inferred(12),
      maxConversionsPerSession: 8,
      forecast: readyForecast(openSessions(500)),
    });
    const second = admit({
      candidates: inferred(12),
      maxConversionsPerSession: 8,
      forecast: readyForecast(openSessions(500)),
    });

    expect(second.admitted.map((item) => item.id)).toEqual(
      first.admitted.map((item) => item.id),
    );
    expect(second.admitted.map((item) => (
      item.schedule.kind === "provisional" ? item.schedule.dueAt : null
    ))).toEqual(first.admitted.map((item) => (
      item.schedule.kind === "provisional" ? item.schedule.dueAt : null
    )));
    expect(second.newReservations).toEqual(first.newReservations);
  });

  it("K: PlanningLoadBreakdown reconcilia con plannedSeconds", () => {
    const input: DailyPlanningInput = {
      dailyBudgetSeconds: 900,
      configuredNewWordLimit: 2,
      mandatory: {
        learning: [{
          itemId: "c1k:learn#meaning",
          wordId: "c1k:learn",
          skill: "meaning",
          modality: "recognition",
          dueAt: "2026-08-06T00:00:00.000Z",
        }],
        overdue: [],
        dueToday: [],
        provisionalDue: [],
      },
      candidates: {
        baseSkillActivations: [{
          itemId: "c1k:base#listening",
          wordId: "c1k:base",
          skill: "listening",
          modality: "listening",
        }],
        usageActivations: [],
        newWords: [{ wordId: "c1k:new-1", rank: 1 }],
        placementCandidates: inferred(1),
      },
      estimatedSeconds: { byModality: costs, newWordIntroduction: 10 },
      consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
      previousMode: "normal",
      capacityForecast: {
        sessions: openSessions(900),
        mandatory: [],
        dueReservations: [],
        futureReservations: [],
      },
      placementContext: {
        now: NOW,
        maxConversionsPerSession: 1,
        activeSessionDates: activeDates(),
      },
    };
    const limits: ActivationLimits = {
      maxBaseSkillActivationsPerSession: 2,
      maxUsageActivationsPerSession: 1,
      maxPerItemPerSession: 1,
    };
    const plan = planDailySession(input, limits, DEFAULT_RECOVERY_POLICY);
    const load = plan.loadBreakdown;
    const sum =
      load.mandatoryReviewSeconds
      + load.learningStepSeconds
      + load.pendingBaseSeconds
      + load.placementSeconds
      + load.usageSeconds
      + load.newWordSeconds;

    expect(sum).toBe(plan.allowance.plannedSeconds);
    expect(load).toMatchObject<Partial<PlanningLoadBreakdown>>({
      learningStepSeconds: costs.recognition,
      pendingBaseSeconds: costs.listening,
    });
    expect(Object.keys(load)).not.toContain("skillSeconds");
  });

  it("L: advanced genera placement no trivial sin romper C1–C5", () => {
    const result = runSimulation(PROFILES.advanced, {
      days: 180,
      corpusSize: 300,
      seed: 42,
      startAt: "2026-08-01T00:00:00.000Z",
      dailyBudgetSeconds: 900,
      targetNewWords: 6,
    });

    const conversions = result.days.reduce((total, day) => (
      total + day.placementConversions
    ), 0);
    const candidates = result.days.reduce((total, day) => (
      total + (day.placementCandidates ?? 0)
    ), 0);

    expect(candidates).toBeGreaterThan(0);
    expect(conversions).toBeGreaterThan(0);
    expect(result.world.futureReservations.some((item) => (
      item.source === "placement" && item.skill === "listening"
    )) || result.worldCounts.placementConversions > 0).toBe(true);

    expect(budgetRespected(result.days, 900)).toMatchObject({ passed: true });
    expect(percentile95WithinBudget(result.days, 900)).toMatchObject({ passed: true });
    expect(recoveryExits(result.days)).toMatchObject({ passed: true });
    expect(backlogStable(result.days, 14, 2, 900)).toMatchObject({ passed: true });
  }, 120_000);

  it("sin forecast hasta dueAt devuelve insufficient-forecast y no convierte", () => {
    const result = admit({
      candidates: inferred(2),
      activeSessionDates: [],
      forecast: readyForecast(openSessions(500)),
    });

    expect(result.status).toBe("insufficient-forecast");
    expect(result.admitted).toEqual([]);
  });

  it("convertInferences sin capacidad sigue respetando el techo diario", () => {
    expect(
      convertInferences(inferred(50), DEFAULT_CONVERSIONS_PER_DAY, NOW),
    ).toHaveLength(DEFAULT_CONVERSIONS_PER_DAY);
  });
});
