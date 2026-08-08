import { describe, expect, it } from "vitest";
import {
  readSkillEngineRolloutConfig,
  resolveSkillEngineMode,
} from "../feature-flags";

describe("skill engine rollout config", () => {
  it("resuelve off de forma segura para modo inválido", () => {
    const config = readSkillEngineRolloutConfig({
      NEXT_PUBLIC_SKILL_MODEL_MODE: "enabled",
      NEXT_PUBLIC_SKILL_MODEL_COHORT_PERCENT: "100",
    });
    expect(config.mode).toBe("off");
    expect(resolveSkillEngineMode("user-1", config)).toBe("off");
  });

  it("parsea modo, cohorte, salt y usuarios internos", () => {
    expect(readSkillEngineRolloutConfig({
      NEXT_PUBLIC_SKILL_MODEL_MODE: "shadow",
      NEXT_PUBLIC_SKILL_MODEL_COHORT_PERCENT: "12.5",
      NEXT_PUBLIC_SKILL_MODEL_COHORT_SALT: "stable-salt",
      NEXT_PUBLIC_SKILL_MODEL_INTERNAL_USERS: " user-1, user-2 ",
    })).toEqual({
      mode: "shadow",
      cohortPercent: 12.5,
      cohortSalt: "stable-salt",
      internalUsers: ["user-1", "user-2"],
    });
  });
});
