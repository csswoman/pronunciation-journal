// @vitest-environment jsdom
import { useEffect, useState, createElement, type ComponentType } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const dailyCardState = vi.hoisted(() => ({ empty: false, settled: true }));
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
  }) => {
    useEffect(() => {
      onPlanStatusChange?.({
        empty: dailyCardState.empty,
        settled: dailyCardState.settled,
        reviewIsEntry: false,
        conceptSlug: null,
        allDone: false,
        arc: undefined,
        stepCount: 5,
      });
    }, [onPlanStatusChange]);
    return <div>Daily plan</div>;
  },
}));
vi.mock("@/components/home/HomeReviewBanner", () => ({ default: () => null }));
vi.mock("@/components/home/HomeJournalCard", () => ({
  default: () => <div>Diario card</div>,
}));
vi.mock("@/components/home/EssentialWordsProgressCard", () => ({ default: () => null }));
vi.mock("@/components/home/WeakSoundCard", () => ({ default: () => null }));
vi.mock("@/components/home/HomeWordOfDayCard", () => ({
  default: () => <div>Palabra del día</div>,
}));
vi.mock("@/components/home/HomeSpeakPrompt", () => ({
  default: () => <div>Speak prompt</div>,
}));
vi.mock("@/components/home/LearningFocusCard", () => ({
  default: () => null,
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
  // Wait for dynamic HomeDailyCard mock to mount and report plan status.
  await waitFor(() => {
    expect(screen.getByText("Daily plan")).toBeInTheDocument();
  });
  // Parent state updates from onPlanStatusChange need a second commit.
  if (dailyCardState.settled) {
    await waitFor(() => {
      expect(screen.getByText("Diario card")).toBeInTheDocument();
    });
  }
}

describe("HomeCommandGrid journal and lessons", () => {
  it("shows the journal card when the plan is settled and never a loose learn row", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });
    expect(screen.getByText("Diario card")).toBeInTheDocument();
    expect(screen.queryByText(/mini lección/i)).not.toBeInTheDocument();
  });

  it("hides the journal card while the plan is still loading", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = false;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });
    expect(screen.queryByText("Diario card")).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid first-visit activation", () => {
  it("shows one activation strip when the plan is empty for a new learner", async () => {
    dailyCardState.empty = true;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: false },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: false },
    });

    expect(
      screen.getByRole("heading", { name: /Una práctica ahora/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir laboratorio/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
    expect(
      screen.queryByRole("heading", { name: "Empieza el plan desde tu nivel" }),
    ).not.toBeInTheDocument();
  });

  it("keeps assessment links optional inside activation", async () => {
    dailyCardState.empty = true;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: false },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: false },
    });

    expect(screen.getByRole("link", { name: /prueba de nivel/i })).toHaveAttribute(
      "href",
      "/assessment",
    );
    expect(screen.getByRole("link", { name: /diagnóstico oral/i })).toHaveAttribute(
      "href",
      "/assessment/pronunciation",
    );
  });

  it("does not show activation or aside setup while the plan is still loading", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = false;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: false },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: false },
    });

    expect(
      screen.queryByRole("heading", { name: /Una práctica ahora/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ajusta tu ruta")).not.toBeInTheDocument();
    expect(screen.queryByText("Diagnóstico oral")).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid placement visibility", () => {
  it("keeps setup quiet in the aside when the plan already owns the fold", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: false },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Una práctica ahora/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the compact reminder after meaningful practice", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    expect(screen.getByText("Palabra del día")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
  });

  it("hides every placement prompt after completion", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    expect(screen.queryByText("Ajusta tu ruta")).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid pronunciation diagnostic visibility", () => {
  it("shows both setups as quiet aside cards when the plan owns the fold", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: false },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: false },
    });

    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });

  it("keeps setup CTAs soft when they sit beside an active plan", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: false },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: false },
    });

    const placementCta = screen.getByRole("link", { name: /Hacer prueba de nivel/i });
    const pronunciationCta = screen.getByRole("link", { name: /Hacer diagnóstico oral/i });
    expect(placementCta.className).not.toMatch(/\bbg-primary\b/);
    expect(pronunciationCta.className).not.toMatch(/\bbg-primary\b/);
  });

  it("shows only the CEFR prompt when CEFR is done but pronunciation diagnostic is not", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: false },
    });

    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });

  it("shows only the pronunciation prompt when pronunciation diagnostic is done but CEFR is not", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: false, hasMeaningfulProgress: false },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Evalúa tu pronunciación" }),
    ).not.toBeInTheDocument();
  });

  it("hides both prompts when CEFR placement and pronunciation diagnostic are both complete", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    });

    expect(screen.queryByText("Ajusta tu ruta")).not.toBeInTheDocument();
    expect(screen.queryByText("Diagnóstico oral")).not.toBeInTheDocument();
  });

  it("never treats a default CEFR placement flag as pronunciation diagnostic completion", async () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    await renderSettledGrid({
      placementState: { hasPlacement: true, hasMeaningfulProgress: true },
      pronunciationDiagnosticState: { hasPronunciationDiagnostic: false },
    });

    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });
});
