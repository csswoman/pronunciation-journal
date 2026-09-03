// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeHeroCard from "@/components/home/HomeHeroCard";
import type { DailyStep, DailyStepStatus } from "@/hooks/useDailyPlan";

function makeStep(overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    kind: "word_review",
    id: "step-1",
    title: "Repaso de palabras",
    subtitle: "Afianza 6 palabras de tu vocabulario",
    icon: "book",
    exercises: [],
    estMinutes: 5,
    ...overrides,
  };
}

function statusMap(map: Record<string, DailyStepStatus>) {
  return (stepId: string) => map[stepId] ?? "pending";
}

describe("HomeHeroCard", () => {
  it("renders daily session step title and right-side illustration", () => {
    const steps = [makeStep({ kind: "phoneme_focus", title: "Sonido del día" })];
    render(
      <HomeHeroCard
        steps={steps}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
      />
    );

    expect(screen.getByText("Sonido del día")).toBeInTheDocument();
    expect(screen.getByTestId("hero-illustration")).toBeInTheDocument();
  });

  it("renders stateCompletado illustration when allDone is true", () => {
    const steps = [makeStep({ id: "step-1" })];
    render(
      <HomeHeroCard
        steps={steps}
        getStepStatus={statusMap({ "step-1": "done" })}
        completedCount={1}
        allDone={true}
        onStartStep={vi.fn()}
      />
    );

    expect(screen.getByText("¡Todo listo por hoy!")).toBeInTheDocument();
    expect(screen.getByTestId("hero-illustration")).toBeInTheDocument();
  });
});
