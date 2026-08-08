import {
  resolveSkillEngineMode,
  type SkillEngineMode,
  type SkillEngineRolloutConfig,
} from "../feature-flags";
import {
  runShadowComparison,
  type ShadowRunnerOptions,
} from "./shadow-runner";

export interface EssentialWordsEngine<
  BuildInput,
  SessionPlan,
  RecordAttemptInput,
  ProgressInput,
  ProgressSnapshot,
> {
  buildSession(input: BuildInput): Promise<SessionPlan>;
  recordAttempt(input: RecordAttemptInput): Promise<void>;
  getProgress(input: ProgressInput): Promise<ProgressSnapshot>;
}

export interface EssentialWordsEngineRouter<
  BuildInput,
  SessionPlan,
  RecordAttemptInput,
  ProgressInput,
  ProgressSnapshot,
> extends EssentialWordsEngine<
  BuildInput,
  SessionPlan,
  RecordAttemptInput,
  ProgressInput,
  ProgressSnapshot
> {
  readonly mode: SkillEngineMode;
}

interface RouterDependencies<
  BuildInput,
  SessionPlan,
  RecordAttemptInput,
  ProgressInput,
  ProgressSnapshot,
> {
  userId: string;
  rollout: SkillEngineRolloutConfig;
  legacyEngine: EssentialWordsEngine<
    BuildInput,
    SessionPlan,
    RecordAttemptInput,
    ProgressInput,
    ProgressSnapshot
  >;
  skillEngine: EssentialWordsEngine<
    BuildInput,
    SessionPlan,
    RecordAttemptInput,
    ProgressInput,
    ProgressSnapshot
  >;
  shadow: ShadowRunnerOptions<SessionPlan, SessionPlan>;
}

async function observeReadonlyShadow<T>(calculate: () => Promise<T>): Promise<void> {
  try {
    await calculate();
  } catch {
    // Shadow reads must never change the legacy experience.
  }
}

/** The only off/shadow/on branch. Engines and repositories receive no flag. */
export function createEssentialWordsEngineRouter<
  BuildInput,
  SessionPlan,
  RecordAttemptInput,
  ProgressInput,
  ProgressSnapshot,
>(dependencies: RouterDependencies<
  BuildInput,
  SessionPlan,
  RecordAttemptInput,
  ProgressInput,
  ProgressSnapshot
>): EssentialWordsEngineRouter<
  BuildInput,
  SessionPlan,
  RecordAttemptInput,
  ProgressInput,
  ProgressSnapshot
> {
  const { legacyEngine, skillEngine } = dependencies;
  const mode = resolveSkillEngineMode(dependencies.userId, dependencies.rollout);

  return {
    mode,
    async buildSession(input) {
      if (mode === "on") return skillEngine.buildSession(input);
      if (mode === "shadow") {
        const result = await runShadowComparison(
          input,
          { buildSession: (value) => legacyEngine.buildSession(value) },
          { buildSession: (value) => skillEngine.buildSession(value) },
          dependencies.shadow,
        );
        return result.session;
      }
      return legacyEngine.buildSession(input);
    },
    async recordAttempt(input) {
      if (mode === "on") return skillEngine.recordAttempt(input);
      return legacyEngine.recordAttempt(input);
    },
    async getProgress(input) {
      if (mode === "on") return skillEngine.getProgress(input);
      const legacy = await legacyEngine.getProgress(input);
      if (mode === "shadow") {
        await observeReadonlyShadow(() => skillEngine.getProgress(input));
      }
      return legacy;
    },
  };
}
