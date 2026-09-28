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

    expect(screen.getByRole("heading", { name: "Sonido del día" })).toBeInTheDocument();
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

  it("shows immediate step cost on primary button and total in plan toggle", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const steps = [
      makeStep({ id: "s-1", estMinutes: 7 }),
      makeStep({ id: "s-2", estMinutes: 10 }),
      makeStep({ id: "s-3", estMinutes: 5 }),
    ];
    render(
      <HomeHeroCard
        steps={steps}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
        needsPlacement
      />
    );

    // Primary CTA displays immediate duration
    expect(screen.getByRole("button", { name: /^empezar · 7 min$/i })).toBeInTheDocument();

    // Toggle shows total session metrics
    const toggle = screen.getByRole("button", { name: /ver todas las actividades \(3\) · 22 min/i });
    expect(toggle).toBeInTheDocument();

    fireEvent.click(toggle);

    // Expanded list contains locked extra exercises reward
    expect(screen.getByText("Ejercicios extra")).toBeInTheDocument();
    expect(screen.getByText("Se desbloquean al completar tu sesión de hoy")).toBeInTheDocument();

    // Contextual placement hint inside plan
    expect(screen.getByRole("link", { name: /prueba de nivel/i })).toBeInTheDocument();
  });

  it("calls onStartStep when clicking on a step item in the list", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const onStartStep = vi.fn();
    const steps = [
      makeStep({ id: "s-1", title: "Sonido del día" }),
      makeStep({ id: "s-2", title: "Lectura en contexto", kind: "reader" }),
    ];
    render(
      <HomeHeroCard
        steps={steps}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={onStartStep}
      />
    );

    const stepButton = screen.getByRole("button", { name: /Lectura en contexto/i });
    expect(stepButton).toBeInTheDocument();
    fireEvent.click(stepButton);

    expect(onStartStep).toHaveBeenCalledWith(steps[1]);
  });

  it("starts the next required step and previews new content without making theory mandatory", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const onStartStep = vi.fn();
    const steps = [
      makeStep({ id: "theory", kind: "concept", title: "Teoría", href: "/mini-lessons/example" }),
      makeStep({ id: "review", title: "Repaso" }),
      makeStep({
        id: "new", kind: "word_intro", title: "Palabras nuevas", featuredWords: ["achieve"],
        selection: { reason: "word_new", source: "word_intro", targetRefs: ["word:achieve"] },
      }),
    ];
    render(<HomeHeroCard
      steps={steps}
      getStepStatus={statusMap({ review: "resolved" })}
      completedCount={1}
      allDone={false}
      onStartStep={onStartStep}
    />);

    expect(screen.getByText("achieve")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^empezar · 5 min$/i }));
    expect(onStartStep).toHaveBeenCalledWith(steps[2]);
  });
});
