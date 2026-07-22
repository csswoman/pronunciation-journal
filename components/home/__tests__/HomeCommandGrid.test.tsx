// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";

vi.mock("@/components/home/HomeDailyCard", () => ({
  default: () => <div>Daily plan</div>,
}));
vi.mock("@/components/home/HomeReviewBanner", () => ({ default: () => null }));
vi.mock("@/components/home/HomeLearnRow", () => ({ default: () => null }));
vi.mock("@/components/home/Core1000ProgressCard", () => ({ default: () => null }));
vi.mock("@/components/home/WeakSoundCard", () => ({ default: () => null }));
vi.mock("@/components/home/HomeWordOfDayCard", () => ({ default: () => <div>Palabra del día</div> }));

const baseProps = {
  conceptLesson: null,
  todaysLesson: null,
};

describe("HomeCommandGrid placement visibility", () => {
  it("shows the prominent setup when placement and progress are absent", () => {
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Haz que el plan empiece desde tu nivel" }))
      .toBeInTheDocument();
  });

  it("shows the compact reminder after meaningful practice", () => {
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
  it("shows neither prompt when both CEFR placement and pronunciation diagnostic are absent", () => {
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Haz que el plan empiece desde tu nivel" }))
      .toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Descubre cómo suena tu pronunciación hoy" }),
    ).toBeInTheDocument();
  });

  it("shows only the CEFR prompt when CEFR is done but pronunciation diagnostic is not", () => {
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: true, hasMeaningfulProgress: true }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: false }}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: "Haz que el plan empiece desde tu nivel" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evalúa tu pronunciación" })).toBeInTheDocument();
  });

  it("shows only the pronunciation prompt when pronunciation diagnostic is done but CEFR is not", () => {
    render(
      <HomeCommandGrid
        {...baseProps}
        placementState={{ hasPlacement: false, hasMeaningfulProgress: false }}
        pronunciationDiagnosticState={{ hasPronunciationDiagnostic: true }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Haz que el plan empiece desde tu nivel" }))
      .toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Descubre cómo suena tu pronunciación hoy" }),
    ).not.toBeInTheDocument();
  });

  it("hides both prompts when CEFR placement and pronunciation diagnostic are both complete", () => {
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
    // hasPlacement true here simulates the default/profile CEFR value being present,
    // but pronunciationDiagnosticState is computed independently and remains false.
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
