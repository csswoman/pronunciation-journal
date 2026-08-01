// @vitest-environment jsdom
import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";

const dailyCardState = vi.hoisted(() => ({ empty: false, settled: true }));

vi.mock("@/components/home/HomeDailyCard", () => ({
  default: ({
    onPlanStatusChange,
  }: {
    onPlanStatusChange?: (status: { empty: boolean; settled: boolean }) => void;
  }) => {
    useEffect(() => {
      onPlanStatusChange?.({
        empty: dailyCardState.empty,
        settled: dailyCardState.settled,
      });
    }, [onPlanStatusChange]);
    return <div>Daily plan</div>;
  },
}));
vi.mock("@/components/home/HomeReviewBanner", () => ({ default: () => null }));
vi.mock("@/components/home/HomeLearnRow", () => ({ default: () => null }));
vi.mock("@/components/home/EssentialWordsProgressCard", () => ({ default: () => null }));
vi.mock("@/components/home/WeakSoundCard", () => ({ default: () => null }));
vi.mock("@/components/home/HomeWordOfDayCard", () => ({
  default: () => <div>Palabra del día</div>,
}));

const baseProps = {
  conceptLesson: null,
  todaysLesson: null,
};

describe("HomeCommandGrid first-visit activation", () => {
  it("shows one activation strip when the plan is empty for a new learner", () => {
    dailyCardState.empty = true;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Tu primera práctica empieza hoy" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir laboratorio/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
    expect(
      screen.queryByRole("heading", { name: "Empieza el plan desde tu nivel" }),
    ).not.toBeInTheDocument();
  });

  it("keeps assessment links optional inside activation", () => {
    dailyCardState.empty = true;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(screen.getByRole("link", { name: /prueba de nivel/i })).toHaveAttribute(
      "href",
      "/assessment",
    );
    expect(screen.getByRole("link", { name: /diagnóstico oral/i })).toHaveAttribute(
      "href",
      "/assessment/pronunciation",
    );
  });

  it("does not show activation or aside setup while the plan is still loading", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = false;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: "Tu primera práctica empieza hoy" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ajusta tu ruta")).not.toBeInTheDocument();
    expect(screen.queryByText("Diagnóstico oral")).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid placement visibility", () => {
  it("keeps setup quiet in the aside when the plan already owns the fold", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tu primera práctica empieza hoy" }),
    ).not.toBeInTheDocument();
  });

  it("shows the compact reminder after meaningful practice", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );

    expect(screen.getByText("Palabra del día")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
  });

  it("hides every placement prompt after completion", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: true, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );

    expect(screen.queryByText("Ajusta tu ruta")).not.toBeInTheDocument();
  });
});

describe("HomeCommandGrid pronunciation diagnostic visibility", () => {
  it("shows both setups as quiet aside cards when the plan owns the fold", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });

  it("keeps setup CTAs soft when they sit beside an active plan", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    const placementCta = screen.getByRole("link", { name: /Hacer prueba de nivel/i });
    const pronunciationCta = screen.getByRole("link", { name: /Hacer diagnóstico oral/i });
    expect(placementCta.className).not.toMatch(/\bbg-primary\b/);
    expect(pronunciationCta.className).not.toMatch(/\bbg-primary\b/);
  });

  it("shows only the CEFR prompt when CEFR is done but pronunciation diagnostic is not", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: true, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });

  it("shows only the pronunciation prompt when pronunciation diagnostic is done but CEFR is not", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Evalúa tu pronunciación" }),
    ).not.toBeInTheDocument();
  });

  it("hides both prompts when CEFR placement and pronunciation diagnostic are both complete", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: true, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );

    expect(screen.queryByText("Ajusta tu ruta")).not.toBeInTheDocument();
    expect(screen.queryByText("Diagnóstico oral")).not.toBeInTheDocument();
  });

  it("never treats a default CEFR placement flag as pronunciation diagnostic completion", () => {
    dailyCardState.empty = false;
    dailyCardState.settled = true;
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: true, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });
});
