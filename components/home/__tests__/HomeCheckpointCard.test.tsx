// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomeCheckpointCard from "@/components/home/HomeCheckpointCard";
import type { CheckpointReadiness } from "@/lib/home/checkpoint-readiness";

function makeReadiness(overrides: Partial<CheckpointReadiness>): CheckpointReadiness {
  return {
    ready: false,
    level: "a1",
    requiredTotal: 6,
    completedRequired: 6,
    evidencedRequired: 3,
    missingSlugs: [],
    reason: "ready",
    ...overrides,
  };
}

describe("HomeCheckpointCard", () => {
  it("shows the ready state with a link to the checkpoint at the learner's level", () => {
    const readiness = makeReadiness({ ready: true, reason: "ready", level: "a1" });
    render(<HomeCheckpointCard readiness={readiness} />);

    expect(screen.getByRole("heading", { name: /listo para el checkpoint a2/i }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ir al checkpoint/i }))
      .toHaveAttribute("href", "/assessment?mode=checkpoint&level=a1");
    expect(screen.getByText("6/6 lecciones completadas")).toBeInTheDocument();
  });

  it("shows the lessons_missing state with a link to the next missing lesson", () => {
    const readiness = makeReadiness({
      ready: false,
      reason: "lessons_missing",
      missingSlugs: ["a1-can-capacidad-permiso", "a1-preguntas-do-does"],
    });
    render(<HomeCheckpointCard readiness={readiness} />);

    expect(screen.getByRole("heading", { name: /te faltan 2 lecciones para el checkpoint/i }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continuar lección/i }))
      .toHaveAttribute("href", "/courses/study/a1-can-capacidad-permiso");
  });

  it("renders nothing for no_evidence", () => {
    const readiness = makeReadiness({ ready: false, reason: "no_evidence" });
    const { container } = render(<HomeCheckpointCard readiness={readiness} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for recent_attempt", () => {
    const readiness = makeReadiness({ ready: false, reason: "recent_attempt" });
    const { container } = render(<HomeCheckpointCard readiness={readiness} />);
    expect(container).toBeEmptyDOMElement();
  });
});
