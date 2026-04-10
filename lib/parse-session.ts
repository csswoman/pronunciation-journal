import type { LearningSession, LearningStep } from "./types";

/**
 * Extracts a LearningSession from an AI response string.
 *
 * The AI is instructed to return:
 *   - A short plain-text intro (shown in chat)
 *   - A ```json ... ``` block with the structured session
 *
 * Returns null if no valid JSON block is found.
 */
export function parseSession(responseText: string): LearningSession | null {
  const match = responseText.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;

  try {
    const raw = JSON.parse(match[1].trim()) as unknown;
    if (!isSessionShape(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

/**
 * Returns the chat-visible portion of an AI response:
 * everything BEFORE the ```json block (trimmed).
 * Falls back to the full response if no block is found.
 */
export function extractChatText(responseText: string): string {
  const idx = responseText.indexOf("```json");
  const text = idx > 0 ? responseText.slice(0, idx).trim() : responseText.trim();
  // Remove trailing markdown fences or blank lines
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

// ── Type guard ──────────────────────────────────────────────────────────────

function isSessionShape(v: unknown): v is LearningSession {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  if (typeof obj.title !== "string") return false;
  if (typeof obj.summary !== "string") return false;
  if (!Array.isArray(obj.steps)) return false;
  return obj.steps.every(isValidStep);
}

function isValidStep(s: unknown): s is LearningStep {
  if (!s || typeof s !== "object") return false;
  const step = s as Record<string, unknown>;
  if (step.type === "explanation") return typeof step.content === "string";
  if (step.type === "checklist") return Array.isArray(step.items);
  if (step.type === "exercise") {
    return (
      typeof step.format === "string" &&
      step.data !== null &&
      typeof step.data === "object"
    );
  }
  return false;
}
