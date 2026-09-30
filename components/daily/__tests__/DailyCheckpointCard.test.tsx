// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DailyCheckpointCard from "@/components/daily/DailyCheckpointCard";
import type { CheckpointReadiness } from "@/lib/home/checkpoint-readiness";

function makeReadiness(overrides: Partial<CheckpointReadiness>): CheckpointReadiness {
  return {
    ready: false,
    level: "a1",
    requiredTotal: 6,
    completedRequired: 4,
    evidencedRequired: 3,
    missingSlugs: ["a1-can-capacidad-permiso", "a1-preguntas-do-does"],
    reason: "lessons_missing",
    ...overrides,
  };
}

describe("DailyCheckpointCard", () => {
  it("muestra el estado de lecciones faltantes con barra de progreso y sin botón repetitivo", () => {
    const readiness = makeReadiness({
      ready: false,
      reason: "lessons_missing",
      completedRequired: 4,
      requiredTotal: 6,
      missingSlugs: ["a1-can-capacidad-permiso", "a1-preguntas-do-does"],
    });
    render(<DailyCheckpointCard readiness={readiness} />);

    expect(screen.getByText(/rumbo al checkpoint a2/i)).toBeInTheDocument();
    expect(screen.getByText("4/6")).toBeInTheDocument();
    expect(screen.getByText(/te faltan 2 lecciones para desbloquear el examen/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "67");
    // No debe tener botón de "Continuar lección"
    expect(screen.queryByRole("link", { name: /continuar lección/i })).not.toBeInTheDocument();
  });

  it("muestra el estado listo con enlace al checkpoint", () => {
    const readiness = makeReadiness({
      ready: true,
      reason: "ready",
      level: "a1",
      completedRequired: 6,
      requiredTotal: 6,
      missingSlugs: [],
    });
    render(<DailyCheckpointCard readiness={readiness} />);

    expect(screen.getByText(/listo para checkpoint a2/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /hacer checkpoint/i });
    expect(link).toHaveAttribute("href", "/assessment?mode=checkpoint&level=a1");
  });

  it("muestra aviso pedagógico cuando no hay suficiente evidencia", () => {
    const readiness = makeReadiness({
      ready: false,
      reason: "no_evidence",
      completedRequired: 6,
      requiredTotal: 6,
      missingSlugs: [],
    });
    render(<DailyCheckpointCard readiness={readiness} />);

    expect(screen.getByText(/necesitas afianzar más vocabulario/i)).toBeInTheDocument();
  });

  it("muestra aviso pedagógico tras un intento reciente", () => {
    const readiness = makeReadiness({
      ready: false,
      reason: "recent_attempt",
    });
    render(<DailyCheckpointCard readiness={readiness} />);

    expect(screen.getByText(/presentaste el checkpoint recientemente/i)).toBeInTheDocument();
  });
});
