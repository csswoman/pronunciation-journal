// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeWelcomeTourModal from "../HomeWelcomeTourModal";
import { WELCOME_TOUR_COMPLETED_KEY } from "@/lib/home/onboarding";

describe("HomeWelcomeTourModal", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <HomeWelcomeTourModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("advances through steps, selects level, and completes tour", () => {
    const handleClose = vi.fn();
    const handleLevel = vi.fn();

    render(
      <HomeWelcomeTourModal
        isOpen={true}
        onClose={handleClose}
        onLevelSelected={handleLevel}
      />
    );

    // Step 1: Bienvenida
    expect(screen.getByText("Paso 1 de 3")).toBeDefined();
    expect(screen.getByText("Domina la pronunciación del inglés")).toBeDefined();

    // Click Siguiente -> Step 2
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Paso 2 de 3")).toBeDefined();
    expect(screen.getByText("¿Cuál es tu nivel aproximado?")).toBeDefined();

    // Select A2
    const a2Button = screen.getByRole("button", { name: /Básico \(A2\)/i });
    fireEvent.click(a2Button);

    expect(window.localStorage.getItem("guest-study-level")).toBe("A2");
    expect(handleLevel).toHaveBeenCalledWith("A2");

    // Click Continuar con A2 -> Step 3
    fireEvent.click(screen.getByRole("button", { name: "Continuar con A2" }));
    expect(screen.getByText("Paso 3 de 3")).toBeDefined();
    expect(screen.getByText("Dónde encontrar cada función")).toBeDefined();

    // Finish
    fireEvent.click(screen.getByRole("button", { name: "Comenzar a practicar" }));
    expect(window.localStorage.getItem(WELCOME_TOUR_COMPLETED_KEY)).toBe("1");
    expect(handleClose).toHaveBeenCalled();
  });
});
