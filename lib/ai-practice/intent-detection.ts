import type { ExerciseToolName, ActionToolName } from "./tools/registry";

export type Intent =
  | { type: "exercise_request" }
  | { type: "explanation_request" }
  | { type: "conversation" };

export type ToolConfig = {
  toolChoice: "any" | "none" | "auto";
  allowedTools: ExerciseToolName[] | ActionToolName[] | [];
};

// ReDoS safety: all patterns use only \b word-boundary anchors, simple
// alternation with fixed-length branches, and no nested quantifiers.
// Input is pre-truncated to MAX_INTENT_INPUT_LENGTH before evaluation.
const EXERCISE_PATTERNS = [
  /\b(quiz|test|exercise|practice|drill)\s*(me|us)?\b/i,
  /\bgive me (an? )?(exercise|question|quiz)\b/i,
  /\b(let'?s|want to) practice\b/i,
];

const EXPLANATION_PATTERNS = [
  /\b(explain|what is|what does|how do|tell me about)\b/i,
  /\bwhy (is|are|do|does)\b/i,
];

// Fully anchored — ^ and $ prevent backtracking across the whole string.
const SHORT_EXERCISE_CONTINUATIONS =
  /^(harder|easier|again|next|more|another|ok|yes|sure|go|continue)$/i;

/** Maximum characters examined for intent — prevents regex slowdown on huge inputs. */
const MAX_INTENT_INPUT_LENGTH = 500;

/** Safe default when input is missing or intent is unclear. */
const SAFE_DEFAULT_INTENT: Intent = { type: "conversation" };

export function detectIntent(
  message: string,
  lastAssistantWasExercise = false
): Intent {
  if (!message || typeof message !== "string") return SAFE_DEFAULT_INTENT;

  // Truncate before regex evaluation — patterns only need the first N chars
  const text = message.length > MAX_INTENT_INPUT_LENGTH
    ? message.slice(0, MAX_INTENT_INPUT_LENGTH)
    : message;

  try {
    if (EXERCISE_PATTERNS.some(p => p.test(text))) return { type: "exercise_request" };
    if (EXPLANATION_PATTERNS.some(p => p.test(text))) return { type: "explanation_request" };

    if (lastAssistantWasExercise && SHORT_EXERCISE_CONTINUATIONS.test(text.trim())) {
      return { type: "exercise_request" };
    }

    // Long messages without a match → let the model decide
    if (text.length > 60) return { type: "conversation" };
  } catch {
    return SAFE_DEFAULT_INTENT;
  }

  return SAFE_DEFAULT_INTENT;
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
