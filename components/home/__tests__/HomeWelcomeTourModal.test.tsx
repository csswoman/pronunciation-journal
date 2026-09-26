// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeWelcomeTourModal from "../HomeWelcomeTourModal";
import { WELCOME_TOUR_COMPLETED_KEY } from "@/lib/home/onboarding";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

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

  it("advances through 4 steps, selects level, and completes tour with Empezar a practicar", () => {
    const handleClose = vi.fn();
    const handleLevel = vi.fn();
    const handleStartPractice = vi.fn();

    render(
      <HomeWelcomeTourModal
        isOpen={true}
        onClose={handleClose}
        onLevelSelected={handleLevel}
        onStartPractice={handleStartPractice}
      />
    );

    // Step 1: Bienvenida
    expect(screen.getByText(/Paso 1 de 4/i)).toBeDefined();
    expect(screen.getByText("Deja de entender el inglés. Empieza a oírlo.")).toBeDefined();

    // Click Siguiente → Step 2
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));
    expect(screen.getByText(/Paso 2 de 4/i)).toBeDefined();
    expect(screen.getByText("¿Hasta dónde entiendes sin traducir?")).toBeDefined();

    // Select A2
    const a2Button = screen.getByRole("button", { name: /Can you say that again, please\?/i });
    fireEvent.click(a2Button);

    expect(window.localStorage.getItem("guest-study-level")).toBe("A2");
    expect(handleLevel).toHaveBeenCalledWith("A2");

    // Click Siguiente → Step 4
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));
    expect(screen.getByText(/Paso 3 de 4/i)).toBeDefined();
    expect(screen.getByText("Cinco lugares, un mismo objetivo.")).toBeDefined();

    // Click Siguiente → Step 4
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));
    expect(screen.getByText(/Paso 4 de 4/i)).toBeDefined();
    expect(screen.getByText("Ship o sheep. Dilo y compruébalo.")).toBeDefined();

    // Finish clicking Empezar a practicar
    fireEvent.click(screen.getByRole("button", { name: /Empezar a practicar/i }));
    expect(window.localStorage.getItem(WELCOME_TOUR_COMPLETED_KEY)).toBe("1");
    expect(handleClose).toHaveBeenCalled();
    expect(handleStartPractice).toHaveBeenCalled();
  });
});
