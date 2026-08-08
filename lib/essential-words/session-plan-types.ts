// Shared types for the Fase A session state machine (spec §1.8). Split from
// session-plan.ts so session-plan-blocks.ts and session-plan-time-ceiling.ts
// can import types without importing the state machine itself.

import type { EssentialWord } from "./types";
import type { EssentialWordMode } from "./exercise-modes";

/** One unit of work the hook renders. Exposure has no exercise; practice does. */
export type Step =
  | { id: string; kind: "expose"; word: EssentialWord }
  | { id: string; kind: "exercise"; word: EssentialWord; level: 1 | 2 | 3; mode: EssentialWordMode };

/**
 * One block: 3 or 4 words (spec §1.1), never fewer. `levelReached` tracks the
 * highest level each word has completed *in this block* (monotonicity, §1.5).
 * `failCount` tracks in-block failures per word (reinsertion cap, §1.7).
 * `exposed` tracks which words have had their exposure step already emitted.
 */
export interface Block {
  wordIds: string[];
  levelReached: Record<string, 0 | 1 | 2 | 3>;
  failCount: Record<string, number>;
  exposed: Set<string>;
}

/** Outcome of one exercise attempt, fed back via applyResult. */
export interface AttemptResult {
  wordId: string;
  level: 1 | 2 | 3;
  correct: boolean;
}

/**
 * The full state threaded through nextStep/applyResult. `history` is the
 * ordered list of wordIds emitted as exercise steps so far in the *current
 * block*, used to enforce the distance-≥2 sequencing rule (§1.7).
 * `finalRoundQueue`/`finalRoundDone` back the mixed final round (§1.4), run
 * once all blocks are exhausted.
 * `claimedKnownIds` tracks words the learner omitted at exposure; they skip
 * in-block practice and return in the final round for a verification exercise.
 */
export interface SessionState {
  seed: number;
  blocks: Block[];
  blockIndex: number;
  history: string[];
  finalRoundQueue: string[];
  finalRoundDone: boolean;
  claimedKnownIds: Set<string>;
}
