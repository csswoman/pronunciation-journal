import { describe, expect, it } from "vitest";
import {
  formatConversationTitle,
  getInitialTitleForModeAndMessage,
  isSystemPromptText,
  titleForStarter,
} from "../conversation-title";
import type { AIConversation } from "@/lib/types";

describe("conversation-title utilities", () => {
  describe("titleForStarter", () => {
    it("names each of the four starters", () => {
      expect(titleForStarter("review")).toBe("Repaso de errores");
      expect(titleForStarter("learn")).toBe("Algo nuevo");
      expect(titleForStarter("world")).toBe("Tus intereses");
      expect(titleForStarter("free")).toBe("Conversación libre");
    });

    it("returns null for anything that is not a starter id", () => {
      expect(titleForStarter("banana")).toBeNull();
      expect(titleForStarter(undefined)).toBeNull();
    });
  });

  describe("isSystemPromptText", () => {
    it("identifies generic prompt instructions starting with 'You are a'", () => {
      expect(isSystemPromptText("You are a warm, encouraging English conversation coach.")).toBe(true);
      expect(isSystemPromptText("You are an English writing coach.")).toBe(true);
    });

    it("returns false for regular user text", () => {
      expect(isSystemPromptText("Hello! I want to practice ordering food at a restaurant.")).toBe(false);
      expect(isSystemPromptText("Can you explain the difference between 'make' and 'do'?")).toBe(false);
    });
  });

  describe("getInitialTitleForModeAndMessage with a starter id", () => {
    it("uses mission communicativeGoal for mission modes", () => {
      const title = getInitialTitleForModeAndMessage("mission:roleplay.cafe");
      expect(title).toBe("Pedir una bebida y confirmar tus preferencias.");
    });

    it("prefers the starter id over the message text", () => {
      const title = getInitialTitleForModeAndMessage("chat", "You are a warm coach...", "review");
      expect(title).toBe("Repaso de errores");
    });

    it("still titles a plain typed message by its text", () => {
      const title = getInitialTitleForModeAndMessage("chat", "I want to talk about films");
      expect(title).toBe("I want to talk about films");
    });

    it("does not title a conversation with raw prompt text when the starter id is missing", () => {
      const title = getInitialTitleForModeAndMessage("chat", "You are a warm, encouraging English conversation coach.");
      expect(title).not.toContain("You are a warm");
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

    it("returns starter title when conversation has starterId or saved title", () => {
      const conv: AIConversation = {
        userId: "user-1",
        templateId: "free-conversation",
        mode: "chat",
        title: "Conversación libre",
        messages: [
          {
            role: "user",
            content: "The student picked free conversation...",
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
            content: "You are a warm, encouraging English conversation coach.",
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
