import type { ExerciseToolName, ActionToolName } from "./tools/registry";

export type Intent =
  | { type: "exercise_request" }
  | { type: "explanation_request" }
  | { type: "conversation" };

export type ToolConfig = {
  toolChoice: "any" | "none" | "auto";
  allowedTools: ExerciseToolName[] | ActionToolName[] | [];
};

const EXERCISE_PATTERNS = [
  /\b(quiz|test|exercise|practice|drill)\s*(me|us)?\b/i,
  /\bgive me (an? )?(exercise|question|quiz)\b/i,
  /\b(let'?s|want to) practice\b/i,
];

const EXPLANATION_PATTERNS = [
  /\b(explain|what is|what does|how do|tell me about)\b/i,
  /\bwhy (is|are|do|does)\b/i,
];

const SHORT_EXERCISE_CONTINUATIONS =
  /^(harder|easier|again|next|more|another|ok|yes|sure|go|continue)$/i;

export function detectIntent(
  message: string,
  lastAssistantWasExercise = false
): Intent {
  if (EXERCISE_PATTERNS.some(p => p.test(message))) return { type: "exercise_request" };
  if (EXPLANATION_PATTERNS.some(p => p.test(message))) return { type: "explanation_request" };

  if (lastAssistantWasExercise && SHORT_EXERCISE_CONTINUATIONS.test(message.trim())) {
    return { type: "exercise_request" };
  }

  // Long messages without a match → let the model decide
  if (message.length > 60) return { type: "conversation" };

  return { type: "conversation" };
}

const EXERCISE_TOOLS: ExerciseToolName[] = [
  "render_multiple_choice",
  "render_fill_blank",
  "render_speaking",
  "render_word_card",
];

const ACTION_TOOLS: ActionToolName[] = ["save_word", "start_roleplay"];

export function intentToToolConfig(intent: Intent): ToolConfig {
  switch (intent.type) {
    case "exercise_request":
      return { toolChoice: "any", allowedTools: EXERCISE_TOOLS };
    case "explanation_request":
      return { toolChoice: "none", allowedTools: [] };
    case "conversation":
      return { toolChoice: "auto", allowedTools: ACTION_TOOLS };
  }
}
