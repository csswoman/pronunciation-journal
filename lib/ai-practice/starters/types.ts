import type { UserLearningState } from "@/lib/ai-practice/learning-state";
import type { Interest } from "@/lib/users/interests";

/** The four slots the chat home offers. `free` is always the fallback. */
export type StarterId = "review" | "learn" | "world" | "free";

/** Everything a starter needs to decide whether it applies and what to say. */
export interface StarterContext {
  state: UserLearningState | null;
  interests: readonly Interest[];
  /** Deterministic per render so tests can pin the chosen angle. */
  seed: number;
  /** Starter ids used in recent sessions, newest first. */
  recentIds: readonly StarterId[];
  /** Opening angles already used recently, so the model avoids repeating them. */
  recentAngles: readonly string[];
  now: number;
}

/** A starter resolved for this particular user, right now. */
export interface ResolvedStarter {
  id: StarterId;
  /** Button label, in Spanish. */
  title: string;
  /** The line under the title carrying the data that justifies it. */
  subtitle: string;
  /** The hidden user message sent to the model. */
  prompt: string;
  /** The angle this render picked, recorded so the next one avoids it. */
  angle: string;
}

/** A registry entry: can it apply, and how does it build itself. */
export interface CoachStarter {
  id: StarterId;
  isAvailable: (ctx: StarterContext) => boolean;
  build: (ctx: StarterContext) => ResolvedStarter;
}
