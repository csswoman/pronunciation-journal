import type { AIConversation, AIConversationMode } from "@/lib/types";
import { getMission } from "@/lib/ai-practice/missions/registry";
import type { StarterId } from "@/lib/ai-practice/starters/types";

const STARTER_TITLES: Record<string, string> = {
  review: "Repaso de errores",
  learn: "Algo nuevo",
  world: "Tus intereses",
  free: "Conversación libre",
  "free-conversation": "Conversación libre",
  "sentence-correction": "Corrige mis oraciones",
  "practice-questions": "Preguntas de práctica",
  "personalized-practice": "Práctica personalizada",
};

/**
 * Titles a conversation by the starter that opened it.
 *
 * This replaced matching against the prompt text: starter prompts are now
 * built per user and per session, so no fixed string could identify them.
 */
export function titleForStarter(id: string | undefined): string | null {
  if (!id) return null;
  return STARTER_TITLES[id as StarterId] ?? null;
}

/** Checks if a text string is a system prompt or empty-state starter prompt. */
export function isSystemPromptText(text: string): boolean {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (/^you are (a|an|the) /i.test(trimmed)) return true;
  if (/^the student (picked|has struggled)/i.test(trimmed)) return true;
  if (/^teach this /i.test(trimmed)) return true;
  if (/^practice english around /i.test(trimmed)) return true;
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

/** Determines the initial title when creating a new conversation. */
export function getInitialTitleForModeAndMessage(
  mode: AIConversationMode,
  text?: string,
  starterId?: string,
): string {
  if (mode?.startsWith("mission:")) {
    const missionId = mode.slice("mission:".length);
    const mission = getMission(missionId);
    if (mission?.communicativeGoal) return mission.communicativeGoal;
    return "Misión";
  }

  const starterTitle = titleForStarter(starterId);
  if (starterTitle) return starterTitle;

  if (text && !isSystemPromptText(text)) {
    return text.trim().slice(0, 60);
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

  // 2. Search messages for a non-system-prompt, non-hidden user message (real user content)
  if (Array.isArray(conv.messages)) {
    const realUserMsg = conv.messages.find(
      (m) =>
        m.role === "user" &&
        !(m as { hidden?: boolean }).hidden &&
        typeof m.content === "string" &&
        !isSystemPromptText(m.content),
    );
    if (realUserMsg && typeof realUserMsg.content === "string") {
      return realUserMsg.content.trim().slice(0, 60);
    }
  }

  // 3. If conv has a non-system-prompt title saved, use it
  if (conv.title && !isSystemPromptText(conv.title)) {
    return conv.title;
  }

  // 4. Starter template title fallback
  const starterTitle = titleForStarter(conv.templateId);
  if (starterTitle) return starterTitle;

  // 5. Fallback based on mode
  if (conv.mode === "pronunciation") return "Práctica de pronunciación";
  if (conv.mode === "lesson") return "Lección";
  return "Conversación libre";
}
