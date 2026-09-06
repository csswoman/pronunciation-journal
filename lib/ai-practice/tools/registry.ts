// Tool registry — one tool per exercise format, no generics.
// Validation is done manually (no Zod dependency).

import {
  getMission,
  LEGACY_ROLEPLAY_SCENARIOS,
} from '@/lib/ai-practice/missions/registry'
import type { LegacyRoleplayScenario } from '@/lib/ai-practice/missions/types'

// Shared pedagogical fields (see lib/exercise/design.ts).
// Optional so legacy tool calls keep working; when present they flow into
// the evaluator for richer feedback.
export type CommonWrongAnswer = { value: string; feedback: string };
export type AcceptableAlternative = { value: string; reason: string };
export type ProgressiveHint = { level1: string; level2: string; level3?: string };

export type MultipleChoiceArgs = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topic: string;
  instruction?: string;
  learningGoal?: string;
  commonWrongAnswers?: CommonWrongAnswer[];
  hint?: ProgressiveHint;
};

export type FillBlankArgs = {
  sentence: string;
  answer: string;
  acceptableAnswers?: string[];
  hint?: string | ProgressiveHint;
  topic: string;
  instruction?: string;
  learningGoal?: string;
  acceptableAlternatives?: AcceptableAlternative[];
  commonWrongAnswers?: CommonWrongAnswer[];
};

export type SpeakingArgs = {
  prompt: string;
  target: string;
  ipa?: string;
};

export type WordCardArgs = {
  word: string;
  meaning: string;
  example?: string;
  ipa?: string;
};

export type SaveWordArgs = {
  word: string;
  meaning: string;
  ipa?: string;
};

export type StartMissionArgs = { missionId: string };
export type MissionIntentObservedArgs = { intentId: string };

/** @deprecated Kept only to parse old persisted tool calls. */
export type StartRoleplayArgs = { scenario: LegacyRoleplayScenario };

export type ToolArgs =
  | { name: "render_multiple_choice"; args: MultipleChoiceArgs }
  | { name: "render_fill_blank"; args: FillBlankArgs }
  | { name: "render_speaking"; args: SpeakingArgs }
  | { name: "render_word_card"; args: WordCardArgs }
  | { name: "save_word"; args: SaveWordArgs }
  | { name: "start_mission"; args: StartMissionArgs }
  | { name: "mission_intent_observed"; args: MissionIntentObservedArgs }
  | { name: "start_roleplay"; args: StartRoleplayArgs };

export type ToolName = ToolArgs["name"];
export type ExerciseToolName = "render_multiple_choice" | "render_fill_blank" | "render_speaking" | "render_word_card";
export type ActionToolName = "save_word" | "start_mission" | "mission_intent_observed";

export const EXERCISE_TOOL_NAMES: ExerciseToolName[] = [
  "render_multiple_choice",
  "render_fill_blank",
  "render_speaking",
  "render_word_card",
];

export const ACTION_TOOL_NAMES: ActionToolName[] = ["save_word", "start_mission", "mission_intent_observed"];

export { TOOL_DECLARATIONS } from "./declarations";

const VALID_TOOL_NAMES = new Set<string>([
  ...EXERCISE_TOOL_NAMES,
  ...ACTION_TOOL_NAMES,
  "start_roleplay", // compatibility for old persisted conversations
]);

export function isValidToolName(name: string): name is ToolName {
  return VALID_TOOL_NAMES.has(name);
}

export function isExerciseTool(name: ToolName): name is ExerciseToolName {
  return (EXERCISE_TOOL_NAMES as string[]).includes(name);
}

function assertString(val: unknown, field: string): string {
  if (typeof val !== "string" || !val) throw new Error(`${field} must be a non-empty string`);
  return val;
}

function assertInt(val: unknown, field: string): number {
  if (typeof val !== "number" || !Number.isInteger(val)) throw new Error(`${field} must be an integer`);
  return val;
}

function assertStringArray(val: unknown, field: string): string[] {
  if (!Array.isArray(val) || !val.every(v => typeof v === "string"))
    throw new Error(`${field} must be a string array`);
  return val as string[];
}

function parseCommonWrongAnswers(val: unknown): CommonWrongAnswer[] | undefined {
  if (!Array.isArray(val)) return undefined;
  const out: CommonWrongAnswer[] = [];
  for (const item of val) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (typeof o.value === "string" && typeof o.feedback === "string") {
        out.push({ value: o.value, feedback: o.feedback });
      }
    }
  }
  return out.length ? out : undefined;
}

function parseAcceptableAlternatives(val: unknown): AcceptableAlternative[] | undefined {
  if (!Array.isArray(val)) return undefined;
  const out: AcceptableAlternative[] = [];
  for (const item of val) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (typeof o.value === "string" && typeof o.reason === "string") {
        out.push({ value: o.value, reason: o.reason });
      }
    }
  }
  return out.length ? out : undefined;
}

function parseProgressiveHint(val: unknown): ProgressiveHint | undefined {
  if (!val || typeof val !== "object") return undefined;
  const o = val as Record<string, unknown>;
  if (typeof o.level1 !== "string" || typeof o.level2 !== "string") return undefined;
  return {
    level1: o.level1,
    level2: o.level2,
    level3: typeof o.level3 === "string" ? o.level3 : undefined,
  };
}

export function parseToolArgs(name: ToolName, raw: unknown): ToolArgs["args"] {
  const obj = raw as Record<string, unknown>;

  switch (name) {
    case "render_multiple_choice": {
      const options = assertStringArray(obj.options, "options");
      if (options.length < 2 || options.length > 5) throw new Error("options must have 2–5 items");
      return {
        question: assertString(obj.question, "question"),
        options,
        correctIndex: assertInt(obj.correctIndex, "correctIndex"),
        explanation: typeof obj.explanation === "string" ? obj.explanation : undefined,
        topic: assertString(obj.topic, "topic"),
        instruction: typeof obj.instruction === "string" ? obj.instruction : undefined,
        learningGoal: typeof obj.learningGoal === "string" ? obj.learningGoal : undefined,
        commonWrongAnswers: parseCommonWrongAnswers(obj.commonWrongAnswers),
        hint: parseProgressiveHint(obj.hint),
      } satisfies MultipleChoiceArgs;
    }
    case "render_fill_blank":
      return {
        sentence: assertString(obj.sentence, "sentence"),
        answer: assertString(obj.answer, "answer"),
        acceptableAnswers: Array.isArray(obj.acceptableAnswers)
          ? assertStringArray(obj.acceptableAnswers, "acceptableAnswers")
          : undefined,
        hint: typeof obj.hint === "string" ? obj.hint : parseProgressiveHint(obj.hint),
        topic: assertString(obj.topic, "topic"),
        instruction: typeof obj.instruction === "string" ? obj.instruction : undefined,
        learningGoal: typeof obj.learningGoal === "string" ? obj.learningGoal : undefined,
        acceptableAlternatives: parseAcceptableAlternatives(obj.acceptableAlternatives),
        commonWrongAnswers: parseCommonWrongAnswers(obj.commonWrongAnswers),
      } satisfies FillBlankArgs;
    case "render_speaking":
      return {
        prompt: assertString(obj.prompt, "prompt"),
        target: assertString(obj.target, "target"),
        ipa: typeof obj.ipa === "string" ? obj.ipa : undefined,
      } satisfies SpeakingArgs;
    case "render_word_card":
      return {
        word: assertString(obj.word, "word"),
        meaning: assertString(obj.meaning, "meaning"),
        example: typeof obj.example === "string" ? obj.example : undefined,
        ipa: typeof obj.ipa === "string" ? obj.ipa : undefined,
      } satisfies WordCardArgs;
    case "save_word":
      return {
        word: assertString(obj.word, "word"),
        meaning: assertString(obj.meaning, "meaning"),
        ipa: typeof obj.ipa === "string" ? obj.ipa : undefined,
      } satisfies SaveWordArgs;
    case "start_mission": {
      const missionId = assertString(obj.missionId, "missionId");
      if (!getMission(missionId)) throw new Error(`missionId must refer to a known oral mission`);
      return { missionId } satisfies StartMissionArgs;
    }
    case "mission_intent_observed":
      return { intentId: assertString(obj.intentId, "intentId") } satisfies MissionIntentObservedArgs;
    case "start_roleplay": {
      const valid = LEGACY_ROLEPLAY_SCENARIOS;
      if (!valid.includes(obj.scenario as typeof valid[number]))
        throw new Error(`scenario must be one of: ${valid.join(", ")}`);
      return { scenario: obj.scenario as StartRoleplayArgs["scenario"] } satisfies StartRoleplayArgs;
    }
  }
}
