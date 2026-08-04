// Pure state machine for Fase A session structure (spec §1.8). No I/O; the
// hook (useEssentialWordsSession.ts) is the only caller with side effects.

import { buildBlocks } from "./session-plan-blocks";
import { selectMode, modeHasData } from "./exercise-modes";
import { essentialWordId } from "./types";
import type { EssentialWord } from "./types";
import type { AttemptResult, Block, SessionState, Step } from "./session-plan-types";

export type { SessionState } from "./session-plan-types";

const MAX_REINSERTIONS_PER_WORD = 1;
const MIN_DISTANCE = 2;

export function createSessionPlan(words: EssentialWord[], seed: number): SessionState {
  const blocks = buildBlocks(words, seed);
  return {
    seed,
    blocks,
    blockIndex: 0,
    history: [],
    finalRoundQueue: words.map((w) => essentialWordId(w.word)),
    finalRoundDone: false,
  };
}

function wordById(id: string, allWords: Map<string, EssentialWord>): EssentialWord {
  const w = allWords.get(id);
  if (!w) throw new Error(`session-plan: unknown wordId ${id}`);
  return w;
}

function hasExited(block: Block, id: string): boolean {
  return block.failCount[id] > MAX_REINSERTIONS_PER_WORD;
}

function blockComplete(block: Block): boolean {
  return block.wordIds.every((id) => block.levelReached[id] === 3 || hasExited(block, id));
}

function pickModeForLevel(word: EssentialWord, level: 1 | 2 | 3): { mode: import("./exercise-modes").EssentialWordMode } {
  const repsForLevel = level === 1 ? 0 : level === 2 ? 3 : 6;
  const mode = selectMode({ kind: "review", entry: word, repetitions: repsForLevel });
  return { mode };
}

function nextPendingInBlock(block: Block, history: string[]): { id: string; level: 1 | 2 | 3 } | null {
  for (const level of [1, 2, 3] as const) {
    const candidates = block.wordIds.filter((id) => {
      if (hasExited(block, id)) return false;
      return block.levelReached[id] === level - 1;
    });
    if (candidates.length === 0) continue;
    const recent = history.slice(-MIN_DISTANCE);
    const eligible = candidates.filter((id) => !recent.includes(id));
    const pick = eligible[0] ?? candidates[0];
    return { id: pick, level };
  }
  return null;
}

export function nextStep(state: SessionState, allWords: Map<string, EssentialWord>): Step | null {
  const block = state.blocks[state.blockIndex];
  if (block) {
    const nextToExpose = block.wordIds.find((id) => !block.exposed.has(id));
    if (nextToExpose) return { kind: "expose", word: wordById(nextToExpose, allWords) };

    const pending = nextPendingInBlock(block, state.history);
    if (pending) {
      const word = wordById(pending.id, allWords);
      const { mode } = pickModeForLevel(word, pending.level);
      return { kind: "exercise", word, level: pending.level, mode };
    }
    return finalRoundStep(state, allWords);
  }
  return finalRoundStep(state, allWords);
}

function finalRoundStep(state: SessionState, allWords: Map<string, EssentialWord>): Step | null {
  if (state.finalRoundDone || state.finalRoundQueue.length === 0) return null;
  const id = state.finalRoundQueue[0];
  const word = wordById(id, allWords);
  const mode = modeHasData(word, "cloze_sentence") ? "cloze_sentence" : "speak_sentence";
  return { kind: "exercise", word, level: 3, mode };
}

export function applyResult(
  state: SessionState,
  result: AttemptResult,
  phase: "expose" | "exercise" = "exercise",
): SessionState {
  const blocks = state.blocks.map((b) => ({
    ...b,
    levelReached: { ...b.levelReached },
    failCount: { ...b.failCount },
    exposed: new Set(b.exposed),
  }));
  const block = blocks[state.blockIndex];

  if (phase === "expose") {
    if (block) block.exposed.add(result.wordId);
    return { ...state, blocks };
  }

  if (!block || !block.wordIds.includes(result.wordId)) {
    const finalRoundQueue = state.finalRoundQueue.filter((id) => id !== result.wordId);
    return { ...state, finalRoundQueue, finalRoundDone: finalRoundQueue.length === 0 };
  }

  const history = [...state.history, result.wordId];
  if (result.correct) {
    block.levelReached[result.wordId] = result.level;
  } else {
    block.failCount[result.wordId] += 1;
  }

  let blockIndex = state.blockIndex;
  let nextHistory = history;
  if (blockComplete(block) && blockIndex + 1 < state.blocks.length) {
    blockIndex += 1;
    nextHistory = [];
  } else if (blockComplete(block) && blockIndex + 1 >= state.blocks.length) {
    blockIndex = state.blocks.length;
  }

  return { ...state, blocks, blockIndex, history: nextHistory };
}

export interface PlanCounts {
  newRemaining: number;
  learningRemaining: number;
  reviewRemaining: number;
}

export function deriveCounts(state: SessionState): PlanCounts {
  let newRemaining = 0;
  let learningRemaining = 0;
  let reviewRemaining = 0;
  for (let i = state.blockIndex; i < state.blocks.length; i++) {
    const block = state.blocks[i];
    for (const id of block.wordIds) {
      if (!block.exposed.has(id)) newRemaining += 1;
      if (block.levelReached[id] < 3 && !hasExited(block, id)) {
        reviewRemaining += 1;
        if (block.failCount[id] > 0) learningRemaining += 1;
      }
    }
  }
  reviewRemaining += state.finalRoundQueue.length;
  return { newRemaining, learningRemaining, reviewRemaining };
}

export function removeWord(state: SessionState, wordId: string): SessionState {
  const blocks = state.blocks.map((b) => {
    if (!b.wordIds.includes(wordId)) return b;
    const levelReached = { ...b.levelReached };
    const failCount = { ...b.failCount };
    delete levelReached[wordId];
    delete failCount[wordId];
    const exposed = new Set(b.exposed);
    exposed.delete(wordId);
    return { ...b, wordIds: b.wordIds.filter((id) => id !== wordId), levelReached, failCount, exposed };
  });
  return {
    ...state,
    blocks,
    finalRoundQueue: state.finalRoundQueue.filter((id) => id !== wordId),
    history: state.history.filter((id) => id !== wordId),
  };
}

export function appendWords(state: SessionState, words: EssentialWord[], seed: number): SessionState {
  const newBlocks = buildBlocks(words, seed);
  return {
    ...state,
    blocks: [...state.blocks, ...newBlocks],
    finalRoundQueue: [...state.finalRoundQueue, ...words.map((w) => essentialWordId(w.word))],
  };
}
