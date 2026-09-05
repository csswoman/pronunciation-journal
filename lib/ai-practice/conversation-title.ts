import type { AIConversation, AIConversationMode } from "@/lib/types";
import { getMission } from "@/lib/ai-practice/missions/registry";
import { AI_COACH_EMPTY_STATE_PROMPTS } from "@/lib/ai-prompts";

const PROMPT_TO_TITLE_MAP: Record<string, string> = {
  [AI_COACH_EMPTY_STATE_PROMPTS.freeConversation]: "Conversación libre",
  [AI_COACH_EMPTY_STATE_PROMPTS.sentenceCorrection]: "Corrige mis oraciones",
  [AI_COACH_EMPTY_STATE_PROMPTS.practiceQuestions]: "Preguntas de práctica",
  [AI_COACH_EMPTY_STATE_PROMPTS.personalizedPractice]: "Práctica personalizada",
  [AI_COACH_EMPTY_STATE_PROMPTS.newYorkTrip]: "Viaje a Nueva York",
  [AI_COACH_EMPTY_STATE_PROMPTS.jobInterview]: "Entrevista de trabajo",
  [AI_COACH_EMPTY_STATE_PROMPTS.discussArticle]: "Comentar un artículo",
  [AI_COACH_EMPTY_STATE_PROMPTS.pronunciation]: "Práctica de pronunciación",
};

/** Checks if a text string is a system prompt or empty-state starter prompt. */
export function isSystemPromptText(text: string): boolean {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (PROMPT_TO_TITLE_MAP[trimmed]) return true;
  if (/^you are (a|an|the) /i.test(trimmed)) return true;
  if (
    trimmed.includes("conversation coach") ||
    trimmed.includes("writing coach") ||
    trimmed.includes("interview coach") ||
    trimmed.includes("practice coach") ||
    trimmed.includes("pronunciation coach")
  ) {
    return true;
  }
  return false;
}

/** Resolves a human-readable title for a prompt string if it is a starter prompt. */
export function titleFromStarterPrompt(text: string): string | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (PROMPT_TO_TITLE_MAP[trimmed]) {
    return PROMPT_TO_TITLE_MAP[trimmed];
  }
  if (trimmed.includes("New York City")) return "Viaje a Nueva York";
  if (trimmed.includes("mock interview")) return "Entrevista de trabajo";
  if (trimmed.includes("Socratic method")) return "Preguntas de práctica";
  if (trimmed.includes("writing coach")) return "Corrige mis oraciones";
  if (trimmed.includes("pronunciation coach")) return "Práctica de pronunciación";
  if (trimmed.includes("personalized English coach")) return "Práctica personalizada";
  if (trimmed.includes("discussion-based English coach")) return "Comentar un artículo";
  if (trimmed.includes("warm, encouraging English conversation coach")) return "Conversación libre";
  return null;
}

/** Determines the initial title when creating a new conversation. */
export function getInitialTitleForModeAndMessage(
  mode: AIConversationMode,
  text?: string
): string {
  if (mode?.startsWith("mission:")) {
    const missionId = mode.slice("mission:".length);
    const mission = getMission(missionId);
    if (mission?.communicativeGoal) return mission.communicativeGoal;
    return "Misión";
  }

  if (text) {
    const starterTitle = titleFromStarterPrompt(text);
    if (starterTitle) return starterTitle;
    if (!isSystemPromptText(text)) {
      return text.trim().slice(0, 60);
    }
  }

  if (mode === "pronunciation") return "Práctica de pronunciación";
  if (mode === "lesson") return "Lección";
  return "Conversación libre";
}

/** Formats the display title for a conversation in history or UI. */
export function formatConversationTitle(conv: AIConversation): string {
  // 1. Mission mode always takes precedence
  if (conv.mode?.startsWith("mission:")) {
    const missionId = conv.mode.slice("mission:".length);
    const mission = getMission(missionId);
    if (mission?.communicativeGoal) {
      return mission.communicativeGoal;
    }
    if (conv.title && !isSystemPromptText(conv.title)) {
      return conv.title;
    }
    return "Misión";
  }

  // 2. Search messages for a non-system-prompt user message (real user content)
  if (Array.isArray(conv.messages)) {
    const realUserMsg = conv.messages.find(
      (m) => m.role === "user" && typeof m.content === "string" && !isSystemPromptText(m.content)
    );
    if (realUserMsg && typeof realUserMsg.content === "string") {
      return realUserMsg.content.trim().slice(0, 60);
    }
  }

  // 3. If conv has a non-system-prompt title saved, use it
  if (conv.title && !isSystemPromptText(conv.title)) {
    return conv.title;
  }

  // 4. Check if the first user message was a starter prompt card
  if (Array.isArray(conv.messages)) {
    const firstUserMsg = conv.messages.find(
      (m) => m.role === "user" && typeof m.content === "string"
    );
    if (firstUserMsg && typeof firstUserMsg.content === "string") {
      const starterTitle = titleFromStarterPrompt(firstUserMsg.content);
      if (starterTitle) return starterTitle;
    }
  }

  // 5. Fallback based on mode
  if (conv.mode === "pronunciation") return "Práctica de pronunciación";
  if (conv.mode === "lesson") return "Lección";
  return "Conversación libre";
}
