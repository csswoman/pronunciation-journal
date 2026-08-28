// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AICoachHeader } from "../AICoachPanelParts";

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
