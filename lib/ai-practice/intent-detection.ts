import type { ExerciseToolName, ActionToolName } from "./tools/registry";

export type Intent =
  | { type: "exercise_request" }
  | { type: "explanation_request" }
  | { type: "conversation" };

export type ToolConfig = {
  toolChoice: "any" | "none" | "auto";
  allowedTools: Array<ExerciseToolName | ActionToolName>;
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

const ACTION_TOOLS: ActionToolName[] = ["save_word", "start_mission"];

/**
 * Feedback is not a mode: the coach must be able to correct the student on
 * every kind of turn, so annotate_turn is allowed for all three intents.
 * Explanation requests can no longer use toolChoice "none" for that reason —
 * "auto" with a single allowed tool keeps exercises out just as effectively.
 */
export function intentToToolConfig(intent: Intent): ToolConfig {
  switch (intent.type) {
    case "exercise_request":
      return { toolChoice: "any", allowedTools: [...EXERCISE_TOOLS, "annotate_turn"] };
    case "explanation_request":
      return { toolChoice: "auto", allowedTools: ["annotate_turn"] };
    case "conversation":
      return { toolChoice: "auto", allowedTools: [...ACTION_TOOLS, "annotate_turn"] };
  }
}

/**
 * Tool selection for one chat turn.
 *
 * `isStarter` marks the hidden opening message the chat home sends on the
 * user's behalf. Those are prompts we author, so running them through
 * `detectIntent` is a category error: it reads our own instructions as if the
 * learner had typed them. It bit us concretely — the "learn" starter says
 * "Do NOT call any exercise tool on this first turn", the keyword `exercise`
 * matched EXERCISE_PATTERNS, and the resulting toolChoice "any" forced a tool
 * call while forbidding plain text, so the coach rendered an empty bubble.
 *
 * Every starter opens the same way: prose first, tools only once the learner
 * has replied. So a starter's selection is fixed rather than inferred; `auto`
 * still lets the model reach for annotate_turn to offer saveable words.
 */
export function selectionForRequest(message: string, isStarter: boolean): ToolConfig {
  if (isStarter) {
    return { toolChoice: "auto", allowedTools: [...ACTION_TOOLS, "annotate_turn"] };
  }
  return intentToToolConfig(detectIntent(message));
}
