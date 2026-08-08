// Flags de despliegue. Funciones puras sobre un env inyectable: sin estado
// global, testeables sin tocar process.env real.

type Env = Record<string, string | undefined>;

export type SkillEngineMode = "off" | "shadow" | "on";

export interface SkillEngineRolloutConfig {
  mode: SkillEngineMode;
  cohortPercent: number;
  cohortSalt: string;
  internalUsers: readonly string[];
}

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function isUserInSkillEngineCohort(
  userId: string,
  config: Pick<SkillEngineRolloutConfig, "cohortPercent" | "cohortSalt" | "internalUsers">,
): boolean {
  if (config.internalUsers.includes(userId)) return true;
  const percent = Math.min(100, Math.max(0, config.cohortPercent));
  return stableHash(`${userId}:${config.cohortSalt}`) % 10_000 < percent * 100;
}

export function resolveSkillEngineMode(
  userId: string,
  config: SkillEngineRolloutConfig,
): SkillEngineMode {
  if (config.mode === "off") return "off";
  return isUserInSkillEngineCohort(userId, config) ? config.mode : "off";
}

export function readSkillEngineRolloutConfig(
  env: Env = process.env,
): SkillEngineRolloutConfig {
  const rawMode = env.NEXT_PUBLIC_SKILL_MODEL_MODE;
  const mode: SkillEngineMode = rawMode === "shadow" || rawMode === "on"
    ? rawMode
    : "off";
  const parsedPercent = Number(env.NEXT_PUBLIC_SKILL_MODEL_COHORT_PERCENT ?? 0);
  return {
    mode,
    cohortPercent: Number.isFinite(parsedPercent) ? parsedPercent : 0,
    cohortSalt: env.NEXT_PUBLIC_SKILL_MODEL_COHORT_SALT ?? "",
    internalUsers: (env.NEXT_PUBLIC_SKILL_MODEL_INTERNAL_USERS ?? "")
      .split(",")
      .map((userId) => userId.trim())
      .filter(Boolean),
  };
}
