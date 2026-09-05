// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AICoachHeader, ConversationHistoryPanel } from "../AICoachPanelParts";
import type { AIConversation } from "@/lib/types";
import { AI_COACH_EMPTY_STATE_PROMPTS } from "@/lib/ai-prompts";

describe("AICoachHeader", () => {
  it("renders brand, page label and action buttons with accessible targets", () => {
    const onNewChat = vi.fn();
    const onToggleHistory = vi.fn();
    const onClose = vi.fn();

    render(
      <AICoachHeader
        pageLabel="Practice"
        showHistory={false}
        onNewChat={onNewChat}
        onToggleHistory={onToggleHistory}
        onClose={onClose}
      />
    );

    expect(screen.getByText("AI Coach")).toBeInTheDocument();
    expect(screen.getByText("Practice")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /cerrar|close/i });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();

    const newChatBtn = screen.getByRole("button", { name: /nueva conversación|new chat/i });
    expect(newChatBtn).toBeInTheDocument();
    fireEvent.click(newChatBtn);
    expect(onNewChat).toHaveBeenCalledOnce();

    const historyBtn = screen.getByRole("button", { name: /historial|history/i });
    expect(historyBtn).toBeInTheDocument();
    fireEvent.click(historyBtn);
    expect(onToggleHistory).toHaveBeenCalledOnce();
  });
});

describe("ConversationHistoryPanel", () => {
  it("renders human readable title for starter prompt and mission goal for mission mode", () => {
    const conversations: AIConversation[] = [
      {
        id: 1,
        userId: "user-1",
        templateId: "free-conversation",
        mode: "chat",
        title: "You are a warm, encouraging English conversation coach.",
        messages: [
          {
            role: "user",
            content: AI_COACH_EMPTY_STATE_PROMPTS.freeConversation,
            timestamp: new Date().toISOString(),
          },
        ],
        deviceId: "dev-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        userId: "user-1",
        templateId: "free-conversation",
        mode: "mission:roleplay.cafe",
        title: "",
        messages: [],
        deviceId: "dev-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(
      <ConversationHistoryPanel
        conversations={conversations}
        activeId={1}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Conversación libre")).toBeInTheDocument();
    expect(screen.getByText("Pedir una bebida y confirmar tus preferencias.")).toBeInTheDocument();
  });
});
