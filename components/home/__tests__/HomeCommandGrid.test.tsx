// @vitest-environment jsdom
import { useEffect, useState, createElement, type ComponentType } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const dailyCardState = vi.hoisted(() => ({
  empty: false,
  settled: true,
  allDone: false,
  reviewIsEntry: false,
}));
const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-1" },
    session: null,
    loading: false,
    supabaseEnabled: true,
    signOutUser: vi.fn(async () => undefined),
  })),
}));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
  ) => {
    function DynamicTest(props: Record<string, unknown>) {
      const [Comp, setComp] = useState<ComponentType<Record<string, unknown>> | null>(null);
      useEffect(() => {
        let active = true;
        void loader().then((mod) => {
          if (active) setComp(() => mod.default);
        });
        return () => {
          active = false;
        };
      }, []);
      if (!Comp) return null;
      return createElement(Comp, props);
    }
    return DynamicTest;
  },
}));

vi.mock("@/components/auth/AuthProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/auth/AuthProvider")>();
  return {
    ...actual,
    __esModule: true,
    useAuth: authMock.useAuth,
  };
});

vi.mock("@/components/home/HomeDailyCard", () => ({
  default: ({
    onPlanStatusChange,
    customEmptyState,
    customPrefix,
  }: {
    onPlanStatusChange?: (status: {
      empty: boolean;
      settled: boolean;
      reviewIsEntry: boolean;
      conceptSlug: string | null;
      allDone: boolean;
      arc: undefined;
      stepCount: number;
    }) => void;
    customEmptyState?: React.ReactNode;
    customPrefix?: React.ReactNode;
  }) => {
    useEffect(() => {
      onPlanStatusChange?.({
        empty: dailyCardState.empty,
        settled: dailyCardState.settled,
        reviewIsEntry: dailyCardState.reviewIsEntry,
        conceptSlug: null,
        allDone: dailyCardState.allDone,
        arc: undefined,
        stepCount: 5,
      });
    }, [onPlanStatusChange]);
    return (
      <div>
        {customPrefix}
        <div>Daily plan</div>
        {customEmptyState}
      </div>
    );
  },
}));
vi.mock("@/components/home/HomeReviewBanner", () => ({
  default: () => <div>Review banner</div>,
}));
vi.mock("@/components/home/EssentialWordsProgressCard", () => ({ default: () => null }));
vi.mock("@/components/home/WeakSoundCard", () => ({ default: () => null }));
vi.mock("@/components/home/HomeWordOfDayCard", () => ({
  default: () => <div>Palabra del día</div>,
}));
vi.mock("@/components/home/HomeChunkOfDayCard", () => ({
  default: () => <div>Frase del día</div>,
}));
vi.mock("@/components/home/HomePlanDone", () => ({
  default: () => <div>Plan done</div>,
}));
vi.mock("@/components/home/GuestSaveProgressBanner", () => ({
  default: ({ variant }: { variant?: string }) => (
    <div aria-label="Guardar progreso" data-variant={variant ?? "footer"}>
      Guardar progreso
    </div>
  ),
}));

import HomeCommandGrid from "@/components/home/HomeCommandGrid";

const baseProps = {
  conceptLesson: null,
  profileLevel: null,
};

async function renderSettledGrid(
  props: Omit<Parameters<typeof HomeCommandGrid>[0], "conceptLesson" | "profileLevel"> &
    Partial<typeof baseProps>,
) {
  render(<HomeCommandGrid {...baseProps} {...props} />);
  await waitFor(() => {
    expect(screen.getByText("Daily plan")).toBeInTheDocument();
  });
}

describe("HomeCommandGrid main column", () => {
  it("shows the phrase-of-the-day card inside the explore section, below the plan", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    const plan = screen.getByText("Daily plan");
    const phrases = screen.getAllByText("Frase del día");
    expect(phrases.length).toBeGreaterThan(0);
    const phrase = phrases[0];
    expect(plan.compareDocumentPosition(phrase) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("HomeCommandGrid first-visit activation", () => {
  it("shows one activation strip when the plan is empty for a new learner", async () => {
    dailyCardState.empty = true;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Una práctica ahora/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Abrir laboratorio/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
  });

  it("keeps assessment links optional inside activation", async () => {
    dailyCardState.empty = true;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /prueba de nivel/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /diagnóstico oral/i })).toHaveAttribute(
      "href",
      "/assessment/pronunciation",
    );
  });

  it("does not show activation or setup while the plan is still loading", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = false;
    dailyCardState.allDone = false;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Daily plan")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /Una práctica ahora/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Afina tu nivel" })).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid placement visibility", () => {
  it("uses a quiet route link when the plan owns the fold", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /prueba de nivel/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Afina tu nivel" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Una práctica ahora/i }),
    ).not.toBeInTheDocument();
  });

  it("shows editorial in the aside and defers setup cards during an active plan", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Daily plan")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /prueba de nivel/i })).toBeInTheDocument();
    });
    const words = screen.getAllByText("Palabra del día");
    expect(words.length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Afina tu nivel" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /diagnóstico oral/i })).toBeInTheDocument();
  });

  it("shows setup cards after the plan is complete", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
    expect(screen.getByText("Plan done")).toBeInTheDocument();
  });

  it("hides every placement prompt after completion", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    expect(screen.queryByRole("heading", { name: "Afina tu nivel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^prueba de nivel$/i })).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid pronunciation diagnostic visibility", () => {
  it("shows both setup cards only after the plan is done", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });

  it("keeps setup CTAs soft when they appear after the plan", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Hacer prueba de nivel/i })).toBeInTheDocument();
    });
    const placementCta = screen.getByRole("link", { name: /Hacer prueba de nivel/i });
    const pronunciationCta = screen.getByRole("link", { name: /Hacer diagnóstico oral/i });
    expect(placementCta.className).not.toMatch(/\bbg-primary\b/);
    expect(pronunciationCta.className).not.toMatch(/\bbg-primary\b/);
  });

  it("hides both prompts when CEFR and pronunciation diagnostic are complete", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = true;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    expect(screen.queryByRole("heading", { name: "Afina tu nivel" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Evalúa tu pronunciación" }),
    ).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid guest save prompt", () => {
  it("defers the guest save strip until the new learner finishes the plan", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    authMock.useAuth.mockReturnValue({
      user: { id: "guest-1", is_anonymous: true } as unknown as import("@supabase/supabase-js").User,
      session: null,
      loading: false,
      supabaseEnabled: true,
      signOutUser: vi.fn(async () => undefined),
    });

    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: true, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Daily plan")).toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Guardar progreso")).not.toBeInTheDocument();
  });

  it("places saving progress below the plan for returning guests", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    authMock.useAuth.mockReturnValue({
      user: { id: "guest-1", is_anonymous: true } as unknown as import("@supabase/supabase-js").User,
      session: null,
      loading: false,
      supabaseEnabled: true,
      signOutUser: vi.fn(async () => undefined),
    });

    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    const savePrompt = await screen.findByLabelText("Guardar progreso");
    const plan = screen.getByText("Daily plan");
    expect(savePrompt).toHaveAttribute("data-variant", "footer");
    expect(plan.compareDocumentPosition(savePrompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("HomeCommandGrid review banner", () => {
  const dueProps = {
    wordsDueCount: 22,
    soundsDueCount: 3,
    placementState: { hasPlacement: true, hasMeaningfulProgress: true },
    pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
  };

  it("does not show the review banner while the plan is still loading", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = false;
    dailyCardState.allDone = false;
    dailyCardState.reviewIsEntry = false;
    render(<HomeCommandGrid {...baseProps} {...dueProps} />);
    await waitFor(() => {
      expect(screen.getByText("Daily plan")).toBeInTheDocument();
    });
    expect(screen.queryByText("Review banner")).not.toBeInTheDocument();
  });

  it("shows the review banner after settle when review is not the plan entry", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    dailyCardState.reviewIsEntry = false;
    await renderSettledGrid(dueProps);
    await waitFor(() => {
      expect(screen.getByText("Review banner")).toBeInTheDocument();
    });
  });

  it("hides the review banner after settle when review is already the plan entry", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    dailyCardState.allDone = false;
    dailyCardState.reviewIsEntry = true;
    await renderSettledGrid(dueProps);
    await waitFor(() => {
      expect(screen.queryByText("Review banner")).not.toBeInTheDocument();
    });
  });
});
