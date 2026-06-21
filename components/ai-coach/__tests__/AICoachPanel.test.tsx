// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

const getRecentConversations =
  vi.fn<(limit: number) => Promise<never[]>>(async () => []);

vi.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const { mockStore, resetStore } = vi.hoisted(() => {
  const state = {
    isOpen: false,
    isFullscreen: false,
    panelWidth: 380,
    launch: null,
    close: vi.fn(),
    setPanelWidth: vi.fn(),
    consumeLaunch: vi.fn(() => null),
  };

  return {
    mockStore: state,
    resetStore: () => {
      state.isOpen = false;
      state.isFullscreen = false;
      state.panelWidth = 380;
      state.launch = null;
      getRecentConversations.mockClear();
    },
  };
});

vi.mock("@/lib/stores/aiCoachStore", () => ({
  useAICoachStore: () => mockStore,
}));

vi.mock("@/hooks/useAIPractice", () => ({
  useAIPractice: () => ({
    messages: [],
    isStreaming: false,
    error: null,
    quotaExhausted: false,
    wordToSave: null,
    conversationId: null,
    sendMessage: vi.fn(),
    answerToolCall: vi.fn(),
    openSaveWordModal: vi.fn(),
    closeSaveWordModal: vi.fn(),
    confirmSaveWord: vi.fn(),
    resetSession: vi.fn(),
    finalizeSession: vi.fn(),
    loadConversation: vi.fn(),
    removeConversation: vi.fn(),
  }),
}));

vi.mock("@/lib/db/ai", () => ({
  getRecentConversations: (limit: number) => getRecentConversations(limit),
}));

vi.mock("../AICoachPanelParts", () => ({
  AICoachHeader: () => <div>Header</div>,
  ConversationHistoryPanel: () => null,
}));

vi.mock("../ChatView", () => ({ default: () => null }));
vi.mock("../PronunciationView", () => ({ default: () => null }));
vi.mock("../CustomPromptPanel", () => ({ default: () => null }));
vi.mock("../ChatTabs", () => ({
  default: () => null,
}));
vi.mock("../AICoachHome", () => ({ default: () => null }));
vi.mock("../SaveWordModal", () => ({ default: () => null }));
vi.mock("../ErrorBanner", () => ({ default: () => null }));
vi.mock("../QuotaExhaustedCard", () => ({ default: () => null }));
vi.mock("../usePanelResize", () => ({
  usePanelResize: () => ({ onDragStart: vi.fn() }),
}));

import AICoachPanel from "../AICoachPanel";

describe("AICoachPanel conversation history", () => {
  beforeEach(() => {
    resetStore();
  });

  it("does not read recent conversations while the panel is closed", async () => {
    render(<AICoachPanel />);

    await waitFor(() => {
      expect(getRecentConversations).not.toHaveBeenCalled();
    });
  });

  it("reads recent conversations after the panel opens", async () => {
    mockStore.isOpen = true;

    render(<AICoachPanel />);

    await waitFor(() => {
      expect(getRecentConversations).toHaveBeenCalledWith(30);
    });
  });
});
