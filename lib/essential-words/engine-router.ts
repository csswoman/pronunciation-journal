import {
  resolveSkillEngineMode,
  type SkillEngineMode,
  type SkillEngineRolloutConfig,
} from "../feature-flags";

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

export interface ShadowComparator<SessionPlan, ProgressSnapshot> {
  compareSession?(legacy: SessionPlan, skill: SessionPlan): void | Promise<void>;
  compareProgress?(legacy: ProgressSnapshot, skill: ProgressSnapshot): void | Promise<void>;
  onError?(operation: "buildSession" | "getProgress", error: unknown): void | Promise<void>;
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
  shadowComparator?: ShadowComparator<SessionPlan, ProgressSnapshot>;
}

async function observeShadow<T>(
  operation: "buildSession" | "getProgress",
  calculate: () => Promise<T>,
  compare: (skill: T) => void | Promise<void>,
  comparator?: Pick<ShadowComparator<never, never>, "onError">,
): Promise<void> {
  try {
    await compare(await calculate());
  } catch (error) {
    try {
      await comparator?.onError?.(operation, error);
    } catch {
      // Shadow observability must never change the legacy experience.
    }
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
  const { legacyEngine, skillEngine, shadowComparator } = dependencies;
  const mode = resolveSkillEngineMode(dependencies.userId, dependencies.rollout);

  return {
    mode,
    async buildSession(input) {
      if (mode === "on") return skillEngine.buildSession(input);
      const legacy = await legacyEngine.buildSession(input);
      if (mode === "shadow") {
        await observeShadow(
          "buildSession",
          () => skillEngine.buildSession(input),
          (skill) => shadowComparator?.compareSession?.(legacy, skill),
          shadowComparator,
        );
      }
      return legacy;
    },
    async recordAttempt(input) {
      if (mode === "on") return skillEngine.recordAttempt(input);
      return legacyEngine.recordAttempt(input);
    },
    async getProgress(input) {
      if (mode === "on") return skillEngine.getProgress(input);
      const legacy = await legacyEngine.getProgress(input);
      if (mode === "shadow") {
        await observeShadow(
          "getProgress",
          () => skillEngine.getProgress(input),
          (skill) => shadowComparator?.compareProgress?.(legacy, skill),
          shadowComparator,
        );
      }
      return legacy;
    },
  };
}
