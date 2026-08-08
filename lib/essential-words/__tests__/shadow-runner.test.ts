import { describe, expect, it, vi } from "vitest";
import { runShadowComparison } from "../shadow-runner";

type Session = { source: "legacy" | "skill"; queue: string[] };

const summarizeLegacy = (session: Session) => ({
  queueSize: session.queue.length,
  estimatedSeconds: session.queue.length * 10,
  dueCount: 2,
});

const summarizeSkill = (session: Session) => ({
  queueSize: session.queue.length,
  estimatedSeconds: session.queue.length * 12,
  dueCount: 3,
  mandatorySelected: 2,
  deferredMandatory: 1,
  baseSkillActivations: 1,
  usageActivations: 1,
  mode: "normal" as const,
});

describe("runShadowComparison", () => {
  it("inicia skill sin esperar a que termine legacy", async () => {
    let releaseLegacy!: (session: Session) => void;
    const legacyPending = new Promise<Session>((resolve) => { releaseLegacy = resolve; });
    const skillBuild = vi.fn(async (): Promise<Session> => ({ source: "skill", queue: [] }));
    const pending = runShadowComparison(
      "input",
      { buildSession: () => legacyPending },
      { buildSession: skillBuild },
      { summarizeLegacy, summarizeSkill },
    );

    expect(skillBuild).toHaveBeenCalledOnce();
    releaseLegacy({ source: "legacy", queue: [] });
    await expect(pending).resolves.toMatchObject({ session: { source: "legacy" } });
  });

  it("devuelve exactamente la sesión legacy aunque skill difiera", async () => {
    const legacySession: Session = { source: "legacy", queue: ["private-word"] };
    const result = await runShadowComparison(
      "input",
      { buildSession: vi.fn(async () => legacySession) },
      { buildSession: vi.fn(async () => ({ source: "skill", queue: ["a", "b", "c"] })) },
      { summarizeLegacy, summarizeSkill },
    );
    expect(result.session).toBe(legacySession);
    expect(result.comparison.differences).toMatchObject({ queueSize: 2 });
  });

  it("aísla excepciones skill, normaliza el error y mantiene legacy", async () => {
    const legacySession: Session = { source: "legacy", queue: ["private-word"] };
    const result = await runShadowComparison(
      "input",
      { buildSession: async () => legacySession },
      { buildSession: async () => { throw new Error("skill mapping failed"); } },
      {
        summarizeLegacy,
        summarizeSkill,
        clock: (() => {
          const values = [5, 8];
          return () => values.shift() ?? 8;
        })(),
      },
    );
    expect(result.session).toBe(legacySession);
    expect(result.comparison.skill).toBeNull();
    expect(result.comparison.differences).toBeNull();
    expect(result.comparison.errors).toEqual(["Error:mapping_failed"]);
    expect(result.comparison.computeMs).toBe(3);
  });

  it("skill recibe una capacidad read-only y nunca se invoca persistencia", async () => {
    const persist = vi.fn(async () => undefined);
    const skillWithWriteCapability = {
      buildSession: vi.fn(async (): Promise<Session> => ({ source: "skill", queue: [] })),
      recordAttempt: persist,
    };
    await runShadowComparison(
      "input",
      { buildSession: async (): Promise<Session> => ({ source: "legacy", queue: [] }) },
      skillWithWriteCapability,
      { summarizeLegacy, summarizeSkill },
    );
    expect(persist).not.toHaveBeenCalled();
  });

  it("registra una comparación agregada y computeMs nunca es negativo", async () => {
    const record = vi.fn();
    const result = await runShadowComparison(
      "input",
      { buildSession: async (): Promise<Session> => ({ source: "legacy", queue: [] }) },
      { buildSession: async (): Promise<Session> => ({ source: "skill", queue: [] }) },
      {
        summarizeLegacy,
        summarizeSkill,
        sink: { record },
        now: () => new Date("2026-08-08T10:00:00.000Z"),
        clock: (() => {
          const values = [10, 9];
          return () => values.shift() ?? 9;
        })(),
      },
    );
    expect(result.comparison.computeMs).toBe(0);
    expect(record).toHaveBeenCalledWith(result.comparison);
  });
});
