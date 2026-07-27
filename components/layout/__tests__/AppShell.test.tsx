// @vitest-environment jsdom
import React, { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const quickAddMount = vi.fn();
const aiCoachPanelMount = vi.fn();
const aiCoachTriggerMount = vi.fn();

const { mockStore, resetStore, mockSessionChrome, resetSessionChrome } = vi.hoisted(() => {
  const state = {
    isOpen: false,
    isFullscreen: false,
    panelWidth: 380,
    launch: null as { tab?: string; prefill?: string } | null,
    open: vi.fn(),
    openCoach: vi.fn(),
    consumeLaunch: vi.fn(() => {
      const launch = state.launch;
      if (launch) state.launch = null;
      return launch;
    }),
    close: vi.fn(() => {
      state.isOpen = false;
      state.isFullscreen = false;
    }),
    toggle: vi.fn(() => {
      state.isOpen = !state.isOpen;
    }),
    setFullscreen: vi.fn(),
    setPanelWidth: vi.fn(),
  };

  const sessionChrome = {
    depth: 0,
    enterSession: vi.fn(() => {
      sessionChrome.depth += 1;
    }),
    exitSession: vi.fn(() => {
      sessionChrome.depth = Math.max(0, sessionChrome.depth - 1);
    }),
  };

  return {
    mockStore: state,
    mockSessionChrome: sessionChrome,
    resetSessionChrome: () => {
      sessionChrome.depth = 0;
      sessionChrome.enterSession.mockClear();
      sessionChrome.exitSession.mockClear();
    },
    resetStore: () => {
      state.isOpen = false;
      state.isFullscreen = false;
      state.panelWidth = 380;
      state.launch = null;
      quickAddMount.mockClear();
      aiCoachPanelMount.mockClear();
      aiCoachTriggerMount.mockClear();
      state.open.mockClear();
      state.openCoach.mockClear();
      state.close.mockClear();
      state.toggle.mockClear();
    },
  };
});

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));

let mockUser: { id: string } | null = { id: "user-1" };

vi.mock("@/lib/stores/aiCoachStore", () => ({
  useAICoachStore: () => mockStore,
}));

vi.mock("@/lib/stores/sessionChromeStore", () => ({
  useSessionChromeStore: (selector?: (s: typeof mockSessionChrome) => unknown) =>
    typeof selector === "function" ? selector(mockSessionChrome) : mockSessionChrome,
  selectHideMobileNav: (s: { depth: number }) => s.depth > 0,
}));

vi.mock("@/lib/word-bank/queries", () => ({
  quickAddWord: vi.fn(async () => undefined),
}));

vi.mock("@/components/layout/Sidebar", () => ({
  default: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock("@/components/layout/BottomNav", () => ({
  default: () => <nav data-testid="bottom-nav">BottomNav</nav>,
}));

vi.mock("@/components/vocabulary/words/QuickAddModal", () => ({
  QuickAddModal: ({ open }: { open: boolean }) => {
    quickAddMount();
    return open ? <div data-testid="quick-add-modal">Quick Add</div> : null;
  },
}));

vi.mock("@/components/ai-coach/AICoachPanel", () => ({
  default: () => {
    aiCoachPanelMount();
    return <div data-testid="ai-coach-panel">AI Coach Panel</div>;
  },
}));

vi.mock("@/components/ai-coach/AICoachTrigger", () => ({
  default: () => {
    aiCoachTriggerMount();
    return <button type="button" data-testid="ai-coach-trigger">Coach</button>;
  },
}));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ default?: React.ComponentType; QuickAddModal?: React.ComponentType }>,
  ) => {
    function DynamicMock(props: Record<string, unknown>) {
      const [Component, setComponent] = useState<React.ComponentType | null>(null);

      useEffect(() => {
        loader().then((mod) => {
          const Resolved = mod.default ?? mod.QuickAddModal ?? null;
          if (Resolved) setComponent(() => Resolved);
        });
      }, []);

      if (!Component) return null;
      return <Component {...props} />;
    }

    return DynamicMock;
  },
}));

import AppShell from "../AppShell";

describe("AppShell mount behavior", () => {
  beforeEach(() => {
    resetStore();
    resetSessionChrome();
    mockPathname = "/";
    mockUser = { id: "user-1" };
  });

  it("does not mount Quick Add or AI Coach panel when both surfaces are closed", async () => {
    render(
      <AppShell>
        <div data-testid="page-content">Page</div>
      </AppShell>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    await waitFor(() => {
      expect(aiCoachTriggerMount).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(quickAddMount).not.toHaveBeenCalled();
      expect(aiCoachPanelMount).not.toHaveBeenCalled();
    });
  });

  it("mounts Quick Add when opened via keyboard shortcut", async () => {
    render(
      <AppShell>
        <div>Page</div>
      </AppShell>,
    );

    fireEvent.keyDown(window, { key: "n" });

    await waitFor(() => {
      expect(quickAddMount).toHaveBeenCalled();
      expect(screen.getByTestId("quick-add-modal")).toBeInTheDocument();
    });
  });

  it("mounts AI Coach panel when the panel opens", async () => {
    mockStore.isOpen = true;

    render(
      <AppShell>
        <div>Page</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(aiCoachPanelMount).toHaveBeenCalled();
      expect(screen.getByTestId("ai-coach-panel")).toBeInTheDocument();
    });
  });

  it("mounts AI Coach panel when a launch request exists", async () => {
    mockStore.launch = { tab: "chat", prefill: "hello" };

    render(
      <AppShell>
        <div>Page</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(aiCoachPanelMount).toHaveBeenCalled();
      expect(screen.getByTestId("ai-coach-panel")).toBeInTheDocument();
    });
  });

  it("keeps AI Coach panel mounted after closing once opened", async () => {
    mockStore.isOpen = true;

    const { rerender } = render(
      <AppShell>
        <div>Page</div>
      </AppShell>,
    );

    await waitFor(() => expect(screen.getByTestId("ai-coach-panel")).toBeInTheDocument());

    mockStore.isOpen = false;
    rerender(
      <AppShell>
        <div>Page</div>
      </AppShell>,
    );

    expect(screen.getByTestId("ai-coach-panel")).toBeInTheDocument();
  });

  it("renders only children on public auth paths", () => {
    mockPathname = "/login";

    render(
      <AppShell>
        <div data-testid="auth-page">Login</div>
      </AppShell>,
    );

    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
    expect(aiCoachTriggerMount).not.toHaveBeenCalled();
    expect(quickAddMount).not.toHaveBeenCalled();
    expect(aiCoachPanelMount).not.toHaveBeenCalled();
  });

  it("keeps sidebar on immersive practice routes", async () => {
    mockPathname = "/practice/sounds/sound/ae";

    render(
      <AppShell>
        <div>session</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
    });
  });

  it("uses a narrow column only for immersive practice routes", async () => {
    mockPathname = "/practice/sounds/sound/ae";

    const { container, rerender } = render(
      <AppShell>
        <div>session</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(container.querySelector(".max-w-3xl")).toBeTruthy();
    });

    mockPathname = "/";
    rerender(
      <AppShell>
        <div>home</div>
      </AppShell>,
    );

    expect(container.querySelector(".max-w-3xl")).toBeNull();
  });

  it("hides mobile bottom nav while a practice session is active", async () => {
    mockSessionChrome.depth = 1;

    render(
      <AppShell>
        <div>session</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
  });
});
