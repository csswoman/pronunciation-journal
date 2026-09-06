// Gemini function-calling declarations — the contract we send to the model.
// Kept apart from registry.ts, which validates what comes back.

export const TOOL_DECLARATIONS = [
  {
    name: "render_multiple_choice",
    description:
      "Show a single-answer multiple choice question inline. Include commonWrongAnswers with pedagogical feedback for the distractors whenever possible.",
    parameters: {
      type: "object",
      properties: {
        question:      { type: "string" },
        options:       { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
        correctIndex:  { type: "integer" },
        explanation:   { type: "string" },
        topic:         { type: "string" },
        instruction:   { type: "string" },
        learningGoal:  { type: "string" },
        commonWrongAnswers: {
          type: "array",
          items: {
            type: "object",
            properties: { value: { type: "string" }, feedback: { type: "string" } },
            required: ["value", "feedback"],
          },
        },
        hint: {
          type: "object",
          properties: { level1: { type: "string" }, level2: { type: "string" }, level3: { type: "string" } },
          required: ["level1", "level2"],
        },
      },
      required: ["question", "options", "correctIndex", "topic"],
    },
  },
  {
    name: "render_fill_blank",
    description:
      "Show a sentence with exactly ONE blank to fill, marked with '___'. Never use more than one '___' in the sentence. Include commonWrongAnswers with pedagogical feedback for typical student errors.",
    parameters: {
      type: "object",
      properties: {
        sentence:          { type: "string" },
        answer:            { type: "string" },
        acceptableAnswers: { type: "array", items: { type: "string" } },
        hint:              { type: "string" },
        topic:             { type: "string" },
        instruction:       { type: "string" },
        learningGoal:      { type: "string" },
        acceptableAlternatives: {
          type: "array",
          items: {
            type: "object",
            properties: { value: { type: "string" }, reason: { type: "string" } },
            required: ["value", "reason"],
          },
        },
        commonWrongAnswers: {
          type: "array",
          items: {
            type: "object",
            properties: { value: { type: "string" }, feedback: { type: "string" } },
            required: ["value", "feedback"],
          },
        },
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
    name: "start_mission",
    description: "Start one authored oral mission from the mission registry.",
    parameters: {
      type: "object",
      properties: {
        missionId: { type: "string" },
      },
      required: ["missionId"],
    },
  },
  {
    name: "mission_intent_observed",
    description: "Report one communicative intent the learner clearly expressed in the current oral mission.",
    parameters: {
      type: "object",
      properties: {
        intentId: { type: "string" },
      },
      required: ["intentId"],
    },
  },
];
