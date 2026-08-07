import { describe, expect, it } from "vitest";
import { planUsageAfterLapse } from "../lifecycle";
import type { LearningItem, UsagePayload } from "../../verification/types";

const payload = (over: Partial<UsagePayload> = {}): UsagePayload => ({
  usageKind: "advanced_usage",
  expression: "depend on",
  sentence: "It depends on the weather.",
  acceptedVariants: [],
  generationStatus: "ready",
  metadata: { schemaVersion: 1 },
  activatedAt: "2026-08-01T00:00:00.000Z",
  ...over,
});

const activeUsage = (): LearningItem => ({
  id: "c1k:on#usage:depend-on",
  wordId: "c1k:on",
  skill: "usage",
  contentOrigin: "generated",
  generatorProvider: "gemini",
  payload: payload(),
  schedule: {
    kind: "fsrs",
    dueAt: "2026-08-25T00:00:00.000Z",
    stability: 12,
    difficulty: 5,
    state: "Review",
  },
  repetitions: 3,
  lapses: 0,
  suspended: false,
});

describe("planUsageAfterLapse", () => {
  it("no retira los usage ya activos", () => {
    const result = planUsageAfterLapse([activeUsage()], { canActivateNew: false });
    expect(result.retired).toHaveLength(0);
  });

  it("los activos conservan su calendario propio", () => {
    const before = activeUsage();
    const result = planUsageAfterLapse([before], { canActivateNew: false });
    expect(result.unchanged[0].schedule).toEqual(before.schedule);
  });

  it("bloquea la activación de nuevos mientras no vuelva la madurez", () => {
    const result = planUsageAfterLapse([activeUsage()], { canActivateNew: false });
    expect(result.blockNewActivations).toBe(true);
  });

  it("con madurez recuperada vuelve a permitir activaciones", () => {
    const result = planUsageAfterLapse([activeUsage()], { canActivateNew: true });
    expect(result.blockNewActivations).toBe(false);
  });

  it("un fallo aislado no desestabiliza la experiencia", () => {
    const usages = [activeUsage(), activeUsage()];
    const result = planUsageAfterLapse(usages, { canActivateNew: false });
    expect(result.unchanged).toHaveLength(2);
    expect(result.retired).toHaveLength(0);
  });
});
