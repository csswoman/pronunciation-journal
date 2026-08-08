import { describe, expect, it, vi } from "vitest";
import {
  isUserInSkillEngineCohort,
  resolveSkillEngineMode,
  type SkillEngineMode,
  type SkillEngineRolloutConfig,
} from "../../feature-flags";
import {
  createEssentialWordsEngineRouter,
  type EssentialWordsEngine,
} from "../engine-router";
import type { ShadowRunnerOptions } from "../shadow-runner";

type Plan = { source: "legacy" | "skill"; items: string[] };
type Progress = { source: "legacy" | "skill"; completed: number };
type Engine = EssentialWordsEngine<string, Plan, string, string, Progress>;

const rollout = (
  mode: SkillEngineMode,
  overrides: Partial<SkillEngineRolloutConfig> = {},
): SkillEngineRolloutConfig => ({
  mode,
  cohortPercent: 100,
  cohortSalt: "router-test-v1",
  internalUsers: [],
  ...overrides,
});

function engine(source: "legacy" | "skill"): Engine {
  return {
    buildSession: vi.fn(async () => ({ source, items: [`${source}-item`] })),
    recordAttempt: vi.fn(async () => undefined),
    getProgress: vi.fn(async () => ({ source, completed: source === "legacy" ? 1 : 2 })),
  };
}

const shadowOptions = (
  record = vi.fn(),
): ShadowRunnerOptions<Plan, Plan> => ({
  summarizeLegacy: (session) => ({
    queueSize: session.items.length,
    estimatedSeconds: 10,
    dueCount: 1,
  }),
  summarizeSkill: (session) => ({
    queueSize: session.items.length,
    estimatedSeconds: 12,
    dueCount: 1,
    mandatorySelected: 1,
    deferredMandatory: 0,
    baseSkillActivations: 0,
    usageActivations: 0,
    mode: "normal",
  }),
  sink: { record },
});

function router(mode: SkillEngineMode) {
  const legacyEngine = engine("legacy");
  const skillEngine = engine("skill");
  const recordComparison = vi.fn();
  return {
    legacyEngine,
    skillEngine,
    recordComparison,
    router: createEssentialWordsEngineRouter({
      userId: "user-1",
      rollout: rollout(mode),
      legacyEngine,
      skillEngine,
      shadow: shadowOptions(recordComparison),
    }),
  };
}

describe("resolveSkillEngineMode", () => {
  it("off siempre queda en off, incluso para internos y cohortPercent 100", () => {
    expect(resolveSkillEngineMode("internal", rollout("off", {
      internalUsers: ["internal"],
    }))).toBe("off");
  });

  it("la cohorte es estable para la misma userId y salt", () => {
    const config = rollout("shadow", { cohortPercent: 37 });
    const values = Array.from({ length: 20 }, () => resolveSkillEngineMode("user-42", config));
    expect(new Set(values).size).toBe(1);
  });

  it("cambiar shadow a on no cambia la pertenencia a cohorte", () => {
    const base = rollout("shadow", { cohortPercent: 37 });
    const shadowCohort = isUserInSkillEngineCohort("user-42", base);
    const onConfig = rollout("on", { cohortPercent: 37 });
    expect(shadowCohort).toBe(isUserInSkillEngineCohort("user-42", onConfig));
  });

  it("un usuario interno entra aunque cohortPercent sea cero", () => {
    expect(resolveSkillEngineMode("internal", rollout("shadow", {
      cohortPercent: 0,
      internalUsers: ["internal"],
    }))).toBe("shadow");
  });

  it("no usa Math.random para asignar cohorte", () => {
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random no debe ejecutarse");
    });
    expect(() => resolveSkillEngineMode(
      "user-1",
      rollout("on", { cohortPercent: 50 }),
    )).not.toThrow();
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });
});

describe("createEssentialWordsEngineRouter", () => {
  it("off usa exclusivamente legacy", async () => {
    const fixture = router("off");
    expect(await fixture.router.buildSession("build")).toMatchObject({ source: "legacy" });
    await fixture.router.recordAttempt("attempt");
    expect(await fixture.router.getProgress("progress")).toMatchObject({ source: "legacy" });
    expect(fixture.legacyEngine.buildSession).toHaveBeenCalledOnce();
    expect(fixture.legacyEngine.recordAttempt).toHaveBeenCalledOnce();
    expect(fixture.skillEngine.buildSession).not.toHaveBeenCalled();
    expect(fixture.skillEngine.recordAttempt).not.toHaveBeenCalled();
    expect(fixture.skillEngine.getProgress).not.toHaveBeenCalled();
  });

  it("shadow devuelve legacy y compara cálculos skill", async () => {
    const fixture = router("shadow");
    expect(await fixture.router.buildSession("build")).toMatchObject({ source: "legacy" });
    expect(await fixture.router.getProgress("progress")).toMatchObject({ source: "legacy" });
    expect(fixture.skillEngine.buildSession).toHaveBeenCalledOnce();
    expect(fixture.skillEngine.getProgress).toHaveBeenCalledOnce();
    expect(fixture.recordComparison).toHaveBeenCalledWith(expect.objectContaining({
      legacy: expect.objectContaining({ queueSize: 1 }),
      skill: expect.objectContaining({ queueSize: 1 }),
    }));
  });

  it("shadow nunca llama la persistencia del skill engine", async () => {
    const fixture = router("shadow");
    await fixture.router.recordAttempt("attempt");
    expect(fixture.legacyEngine.recordAttempt).toHaveBeenCalledOnce();
    expect(fixture.skillEngine.recordAttempt).not.toHaveBeenCalled();
  });

  it("un fallo del cálculo shadow nunca rompe el resultado legacy", async () => {
    const fixture = router("shadow");
    vi.mocked(fixture.skillEngine.buildSession).mockRejectedValueOnce(new Error("shadow failed"));
    await expect(fixture.router.buildSession("build")).resolves.toMatchObject({ source: "legacy" });
  });

  it("on usa exclusivamente skill", async () => {
    const fixture = router("on");
    expect(await fixture.router.buildSession("build")).toMatchObject({ source: "skill" });
    await fixture.router.recordAttempt("attempt");
    expect(await fixture.router.getProgress("progress")).toMatchObject({ source: "skill" });
    expect(fixture.skillEngine.recordAttempt).toHaveBeenCalledOnce();
    expect(fixture.legacyEngine.buildSession).not.toHaveBeenCalled();
    expect(fixture.legacyEngine.recordAttempt).not.toHaveBeenCalled();
    expect(fixture.legacyEngine.getProgress).not.toHaveBeenCalled();
  });

  it.each(["off", "shadow"] as const)(
    "%s nunca escribe el bundle skill por interacción",
    async (mode) => {
      const fixture = router(mode);
      await fixture.router.recordAttempt("attempt");
      expect(fixture.skillEngine.recordAttempt).not.toHaveBeenCalled();
      expect(fixture.legacyEngine.recordAttempt).toHaveBeenCalledOnce();
    },
  );

  it("rollback a off cambia la ruta sin mutar los engines", async () => {
    const legacyEngine = engine("legacy");
    const skillEngine = engine("skill");
    const active = createEssentialWordsEngineRouter({
      userId: "user-1", rollout: rollout("on"), legacyEngine, skillEngine,
      shadow: shadowOptions(),
    });
    const rolledBack = createEssentialWordsEngineRouter({
      userId: "user-1", rollout: rollout("off"), legacyEngine, skillEngine,
      shadow: shadowOptions(),
    });
    await active.recordAttempt("on-attempt");
    await rolledBack.recordAttempt("off-attempt");
    expect(skillEngine.recordAttempt).toHaveBeenCalledWith("on-attempt");
    expect(legacyEngine.recordAttempt).toHaveBeenCalledWith("off-attempt");
  });
});
