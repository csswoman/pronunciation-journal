import {
  compareShadowMetrics,
  normalizeShadowError,
  type LegacyShadowMetrics,
  type ShadowComparison,
  type ShadowMetricsSink,
  type SkillShadowMetrics,
} from "./shadow-metrics";

export interface ReadonlySessionEngine<Input, Session> {
  buildSession(input: Input): Promise<Session>;
}

export interface ShadowRunnerOptions<LegacySession, SkillSession> {
  summarizeLegacy(session: LegacySession): LegacyShadowMetrics;
  summarizeSkill(session: SkillSession): SkillShadowMetrics;
  sink?: ShadowMetricsSink;
  now?: () => Date;
  clock?: () => number;
}

export async function runShadowComparison<Input, LegacySession, SkillSession>(
  input: Input,
  legacy: ReadonlySessionEngine<Input, LegacySession>,
  skill: ReadonlySessionEngine<Input, SkillSession>,
  options: ShadowRunnerOptions<LegacySession, SkillSession>,
): Promise<{ session: LegacySession; comparison: ShadowComparison }> {
  const clock = options.clock ?? (() => performance.now());
  const startedAt = clock();
  const skillResult = skill.buildSession(input)
    .then((skillSession) => ({
      metrics: options.summarizeSkill(skillSession),
      computeMs: Math.max(0, clock() - startedAt),
      errors: [] as string[],
    }))
    .catch((error: unknown) => ({
      metrics: null,
      computeMs: Math.max(0, clock() - startedAt),
      errors: [normalizeShadowError(error)],
    }));
  const session = await legacy.buildSession(input);
  const legacyMetrics = options.summarizeLegacy(session);
  const skillOutcome = await skillResult;

  const comparison = compareShadowMetrics(
    (options.now?.() ?? new Date()).toISOString(),
    legacyMetrics,
    skillOutcome.metrics,
    skillOutcome.computeMs,
    skillOutcome.errors,
  );

  try {
    await options.sink?.record(comparison);
  } catch (error) {
    comparison.errors.push(`metrics_sink: ${normalizeShadowError(error)}`);
  }

  return { session, comparison };
}
