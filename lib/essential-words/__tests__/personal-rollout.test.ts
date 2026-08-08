import { describe, expect, it } from "vitest";
import {
  evaluatePersonalRolloutGate,
  PERSONAL_ROLLOUT_POLICY,
  type PersonalRolloutIntegrityChecks,
} from "../personal-rollout";
import type { ShadowComparison } from "../shadow-metrics";
import { runShadowComparison } from "../shadow-runner";

const healthyIntegrity: PersonalRolloutIntegrityChecks = {
  doubleWrites: 0,
  orphanSkillWrites: 0,
  rollbackVerified: true,
};

function comparison(index: number, overrides: Partial<ShadowComparison> = {}): ShadowComparison {
  const legacy = { queueSize: 10, estimatedSeconds: 600, dueCount: 8 };
  const skill = {
    queueSize: 12,
    estimatedSeconds: 660,
    dueCount: 9,
    mandatorySelected: 8,
    deferredMandatory: 1,
    baseSkillActivations: 2,
    usageActivations: 1,
    mode: "normal" as const,
  };
  return {
    occurredAt: `2026-08-08T10:${String(index).padStart(2, "0")}:00.000Z`,
    legacy,
    skill,
    differences: { queueSize: 2, estimatedSeconds: 60, dueCount: 1 },
    computeMs: 15,
    errors: [],
    ...overrides,
  };
}

const sessions = (count = 10): ShadowComparison[] =>
  Array.from({ length: count }, (_, index) => comparison(index));

describe("personal-rollout-v1", () => {
  it("versiona el gate personal sin días, cohortes ni auto-promoción", () => {
    expect(PERSONAL_ROLLOUT_POLICY).toEqual({
      version: "personal-rollout-v1",
      minimumShadowSessions: 10,
      maximumSkillErrors: 0,
      requireZeroDoubleWrites: true,
      requireZeroOrphanSkillWrites: true,
      requireRollbackVerified: true,
    });
    const result = evaluatePersonalRolloutGate(sessions(), healthyIntegrity);
    expect(result).not.toHaveProperty("mode");
    expect(result).not.toHaveProperty("cohort");
    expect(result).not.toHaveProperty("promote");
  });

  it("bloquea con menos de diez sesiones", () => {
    const result = evaluatePersonalRolloutGate(sessions(9), healthyIntegrity);
    expect(result.ready).toBe(false);
    expect(result.blockers).toContain("insufficient_shadow_sessions");
  });

  it("declara ready diez sesiones sanas aunque existan diferencias razonables", () => {
    const result = evaluatePersonalRolloutGate(sessions(), healthyIntegrity);
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.warnings).toEqual([
      "queue_size_differs",
      "estimated_time_differs",
    ]);
    expect(result.summary).toMatchObject({
      shadowSessions: 10,
      legacyQueueSize: { mean: 10, p95: 10 },
      skillQueueSize: { mean: 12, p95: 12 },
      queueSizeDifference: { mean: 2, maxAbsolute: 2 },
      deferredMandatory: { mean: 1, max: 1 },
    });
  });

  it("convierte un error skill en blocker", () => {
    const data = sessions();
    data[0] = comparison(0, {
      skill: null,
      differences: null,
      errors: ["Error:skill_compute_failed"],
    });
    const result = evaluatePersonalRolloutGate(data, healthyIntegrity);
    expect(result.blockers).toContain("skill_compute_errors");
  });

  it("un error del sink no rompe legacy y queda visible como warning", async () => {
    const shadow = await runShadowComparison(
      "input",
      { buildSession: async () => "legacy-session" },
      { buildSession: async () => "skill-session" },
      {
        summarizeLegacy: () => ({ queueSize: 10, estimatedSeconds: 600, dueCount: 8 }),
        summarizeSkill: () => ({
          queueSize: 12,
          estimatedSeconds: 660,
          dueCount: 9,
          mandatorySelected: 8,
          deferredMandatory: 1,
          baseSkillActivations: 2,
          usageActivations: 1,
          mode: "normal",
        }),
        sink: { record: () => { throw new Error("sink unavailable"); } },
      },
    );
    expect(shadow.session).toBe("legacy-session");
    const data = sessions();
    data[0] = shadow.comparison;
    const result = evaluatePersonalRolloutGate(data, healthyIntegrity);
    expect(result.ready).toBe(true);
    expect(result.summary).toMatchObject({ skillComputeErrors: 0, sinkErrors: 1 });
    expect(result.warnings).toContain("sink_errors_observed");
  });

  it.each([
    [{ ...healthyIntegrity, doubleWrites: 1 }, "double_write_detected"],
    [{ ...healthyIntegrity, orphanSkillWrites: 1 }, "orphan_skill_write_detected"],
    [{ ...healthyIntegrity, rollbackVerified: false }, "rollback_not_verified"],
  ] as const)("bloquea una violación de integridad", (integrity, blocker) => {
    expect(evaluatePersonalRolloutGate(sessions(), integrity).blockers).toContain(blocker);
  });

  it("bloquea métricas negativas, NaN o infinitas", () => {
    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const data = sessions();
      data[0] = comparison(0, {
        legacy: { queueSize: invalid, estimatedSeconds: 600, dueCount: 8 },
      });
      expect(evaluatePersonalRolloutGate(data, healthyIntegrity).blockers)
        .toContain("invalid_metrics");
    }
  });

  it("bloquea fechas, diferencias e integrity counts imposibles", () => {
    const invalidDate = sessions();
    invalidDate[0] = comparison(0, { occurredAt: "not-a-date" });
    expect(evaluatePersonalRolloutGate(invalidDate, healthyIntegrity).blockers)
      .toContain("invalid_metrics");

    const invalidDifference = sessions();
    invalidDifference[0] = comparison(0, {
      differences: { queueSize: Number.NaN, estimatedSeconds: 60, dueCount: 1 },
    });
    expect(evaluatePersonalRolloutGate(invalidDifference, healthyIntegrity).blockers)
      .toContain("invalid_metrics");

    expect(evaluatePersonalRolloutGate(sessions(), {
      ...healthyIntegrity,
      doubleWrites: -1,
    }).blockers).toContain("invalid_metrics");
  });

  it("bloquea únicamente discrepancias repetidas evidentemente patológicas", () => {
    const data = sessions().map((item, index) => index < 5
      ? comparison(index, {
        skill: { ...item.skill!, queueSize: 80, estimatedSeconds: 4_000 },
        differences: { queueSize: 70, estimatedSeconds: 3_400, dueCount: 1 },
      })
      : item);
    const result = evaluatePersonalRolloutGate(data, healthyIntegrity);
    expect(result.blockers).toEqual(expect.arrayContaining([
      "pathological_queue_growth",
      "pathological_estimated_time",
    ]));
  });

  it("bloquea deferred creciente persistente y recovery casi siempre", () => {
    const data = sessions().map((item, index) => comparison(index, {
      skill: {
        ...item.skill!,
        deferredMandatory: index < 5 ? 0 : index - 4,
        mode: index === 0 ? "normal" : "recovery",
      },
    }));
    const result = evaluatePersonalRolloutGate(data, healthyIntegrity);
    expect(result.blockers).toEqual(expect.arrayContaining([
      "persistent_deferred_mandatory",
      "recovery_almost_always",
    ]));
    expect(result.warnings).toContain("recovery_observed");
  });

  it("es determinista y no muta la evidencia", () => {
    const data = sessions();
    const snapshot = structuredClone(data);
    const first = evaluatePersonalRolloutGate(data, healthyIntegrity);
    const second = evaluatePersonalRolloutGate(data, healthyIntegrity);
    expect(second).toEqual(first);
    expect(data).toEqual(snapshot);
  });
});
