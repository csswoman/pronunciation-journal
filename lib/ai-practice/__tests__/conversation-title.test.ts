import { describe, expect, it } from "vitest";
import {
  formatConversationTitle,
  getInitialTitleForModeAndMessage,
  isSystemPromptText,
  titleFromStarterPrompt,
} from "../conversation-title";
import { AI_COACH_EMPTY_STATE_PROMPTS } from "@/lib/ai-prompts";
import type { AIConversation } from "@/lib/types";

describe("conversation-title utilities", () => {
  describe("isSystemPromptText", () => {
    it("identifies empty state prompts as system prompts", () => {
      expect(isSystemPromptText(AI_COACH_EMPTY_STATE_PROMPTS.freeConversation)).toBe(true);
      expect(isSystemPromptText(AI_COACH_EMPTY_STATE_PROMPTS.sentenceCorrection)).toBe(true);
      expect(isSystemPromptText(AI_COACH_EMPTY_STATE_PROMPTS.newYorkTrip)).toBe(true);
    });

    it("identifies generic prompt instructions starting with 'You are a'", () => {
      expect(isSystemPromptText("You are a warm, encouraging English conversation coach.")).toBe(true);
      expect(isSystemPromptText("You are an English writing coach.")).toBe(true);
    });

    it("returns false for regular user text", () => {
      expect(isSystemPromptText("Hello! I want to practice ordering food at a restaurant.")).toBe(false);
      expect(isSystemPromptText("Can you explain the difference between 'make' and 'do'?")).toBe(false);
    });
  });

  describe("titleFromStarterPrompt", () => {
    it("maps empty state prompts to human-readable titles", () => {
      expect(titleFromStarterPrompt(AI_COACH_EMPTY_STATE_PROMPTS.freeConversation)).toBe("Conversación libre");
      expect(titleFromStarterPrompt(AI_COACH_EMPTY_STATE_PROMPTS.sentenceCorrection)).toBe("Corrige mis oraciones");
      expect(titleFromStarterPrompt(AI_COACH_EMPTY_STATE_PROMPTS.newYorkTrip)).toBe("Viaje a Nueva York");
      expect(titleFromStarterPrompt(AI_COACH_EMPTY_STATE_PROMPTS.jobInterview)).toBe("Entrevista de trabajo");
    });
  });

  describe("getInitialTitleForModeAndMessage", () => {
    it("uses mission communicativeGoal for mission modes", () => {
      const title = getInitialTitleForModeAndMessage("mission:roleplay.cafe");
      expect(title).toBe("Pedir una bebida y confirmar tus preferencias.");
    });

    it("uses starter prompt title for card prompts", () => {
      const title = getInitialTitleForModeAndMessage("chat", AI_COACH_EMPTY_STATE_PROMPTS.freeConversation);
      expect(title).toBe("Conversación libre");
    });

    it("uses user message text for real user messages", () => {
      const title = getInitialTitleForModeAndMessage("chat", "I want to practice my job interview skills");
      expect(title).toBe("I want to practice my job interview skills");
    });
  });

  describe("formatConversationTitle", () => {
    it("returns mission goal for mission conversations even with no messages", () => {
      const conv: AIConversation = {
        userId: "user-1",
        templateId: "free-conversation",
        mode: "mission:roleplay.cafe",
        title: "",
        messages: [],
        deviceId: "dev-1",
        createdAt: "2026-09-05T00:00:00Z",
        updatedAt: "2026-09-05T00:00:00Z",
      };
      expect(formatConversationTitle(conv)).toBe("Pedir una bebida y confirmar tus preferencias.");
    });

    it("returns card title when conversation only contains starter prompt", () => {
      const conv: AIConversation = {
        userId: "user-1",
        templateId: "free-conversation",
        mode: "chat",
        title: "You are a warm, encouraging English conversation coach.",
        messages: [
          {
            role: "user",
            content: AI_COACH_EMPTY_STATE_PROMPTS.freeConversation,
            timestamp: "2026-09-05T00:00:00Z",
          },
        ],
        deviceId: "dev-1",
        createdAt: "2026-09-05T00:00:00Z",
        updatedAt: "2026-09-05T00:00:00Z",
      };
      expect(formatConversationTitle(conv)).toBe("Conversación libre");
    });

    it("returns the first real user message if present after a starter prompt", () => {
      const conv: AIConversation = {
        userId: "user-1",
        templateId: "free-conversation",
        mode: "chat",
        title: "Conversación libre",
        messages: [
          {
            role: "user",
            content: AI_COACH_EMPTY_STATE_PROMPTS.freeConversation,
            timestamp: "2026-09-05T00:00:00Z",
          },
          {
            role: "model",
            content: "Hi there! How was your day?",
            timestamp: "2026-09-05T00:00:01Z",
          },
          {
            role: "user",
            content: "My day was great, I went to the park and saw dogs",
            timestamp: "2026-09-05T00:00:02Z",
          },
        ],
        deviceId: "dev-1",
        createdAt: "2026-09-05T00:00:00Z",
        updatedAt: "2026-09-05T00:00:02Z",
      };
      expect(formatConversationTitle(conv)).toBe("My day was great, I went to the park and saw dogs");
    });
  });
});
