// Tool registry — one tool per exercise format, no generics.
// Validation is done manually (no Zod dependency).

export type MultipleChoiceArgs = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topic: string;
};

export type FillBlankArgs = {
  sentence: string;
  answer: string;
  acceptableAnswers?: string[];
  hint?: string;
  topic: string;
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

export type StartRoleplayArgs = {
  scenario: "interview" | "cafe" | "airport" | "doctor" | "store";
};

export type ToolArgs =
  | { name: "render_multiple_choice"; args: MultipleChoiceArgs }
  | { name: "render_fill_blank"; args: FillBlankArgs }
  | { name: "render_speaking"; args: SpeakingArgs }
  | { name: "render_word_card"; args: WordCardArgs }
  | { name: "save_word"; args: SaveWordArgs }
  | { name: "start_roleplay"; args: StartRoleplayArgs };

export type ToolName = ToolArgs["name"];
export type ExerciseToolName = "render_multiple_choice" | "render_fill_blank" | "render_speaking" | "render_word_card";
export type ActionToolName = "save_word" | "start_roleplay";

export const EXERCISE_TOOL_NAMES: ExerciseToolName[] = [
  "render_multiple_choice",
  "render_fill_blank",
  "render_speaking",
  "render_word_card",
];

export const ACTION_TOOL_NAMES: ActionToolName[] = ["save_word", "start_roleplay"];

// Gemini-compatible tool declarations
export const TOOL_DECLARATIONS = [
  {
    name: "render_multiple_choice",
    description: "Show a single-answer multiple choice question inline.",
    parameters: {
      type: "object",
      properties: {
        question:     { type: "string" },
        options:      { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
        correctIndex: { type: "integer" },
        explanation:  { type: "string" },
        topic:        { type: "string" },
      },
      required: ["question", "options", "correctIndex", "topic"],
    },
  },
  {
    name: "render_fill_blank",
    description: "Show a sentence with a blank to fill. The sentence must contain '___'.",
    parameters: {
      type: "object",
      properties: {
        sentence:          { type: "string" },
        answer:            { type: "string" },
        acceptableAnswers: { type: "array", items: { type: "string" } },
        hint:              { type: "string" },
        topic:             { type: "string" },
      },
      required: ["sentence", "answer", "topic"],
    },
  },
  {
    name: "render_speaking",
    description: "Ask the student to pronounce a target phrase.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        target: { type: "string" },
        ipa:    { type: "string" },
      },
      required: ["prompt", "target"],
    },
  },
  {
    name: "render_word_card",
    description: "Show a vocabulary card with meaning and example.",
    parameters: {
      type: "object",
      properties: {
        word:    { type: "string" },
        meaning: { type: "string" },
        example: { type: "string" },
        ipa:     { type: "string" },
      },
      required: ["word", "meaning"],
    },
  },
  {
    name: "save_word",
    description: "Save a word to the student's vocabulary list.",
    parameters: {
      type: "object",
      properties: {
        word:    { type: "string" },
        meaning: { type: "string" },
        ipa:     { type: "string" },
      },
      required: ["word", "meaning"],
    },
  },
  {
    name: "start_roleplay",
    description: "Switch to roleplay mode with a specific scenario.",
    parameters: {
      type: "object",
      properties: {
        scenario: { type: "string", enum: ["interview", "cafe", "airport", "doctor", "store"] },
      },
      required: ["scenario"],
    },
  },
];

const VALID_TOOL_NAMES = new Set<string>([...EXERCISE_TOOL_NAMES, ...ACTION_TOOL_NAMES]);

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
      } satisfies MultipleChoiceArgs;
    }
    case "render_fill_blank":
      return {
        sentence: assertString(obj.sentence, "sentence"),
        answer: assertString(obj.answer, "answer"),
        acceptableAnswers: Array.isArray(obj.acceptableAnswers)
          ? assertStringArray(obj.acceptableAnswers, "acceptableAnswers")
          : undefined,
        hint: typeof obj.hint === "string" ? obj.hint : undefined,
        topic: assertString(obj.topic, "topic"),
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
    case "start_roleplay": {
      const valid = ["interview", "cafe", "airport", "doctor", "store"] as const;
      if (!valid.includes(obj.scenario as typeof valid[number]))
        throw new Error(`scenario must be one of: ${valid.join(", ")}`);
      return { scenario: obj.scenario as StartRoleplayArgs["scenario"] } satisfies StartRoleplayArgs;
    }
  }
}
