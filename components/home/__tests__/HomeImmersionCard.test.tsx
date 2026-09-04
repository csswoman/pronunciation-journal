// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeImmersionCard from "@/components/home/HomeImmersionCard";

describe("HomeImmersionCard", () => {
  it("renders immersion log prompt bar and expands category options on click", () => {
    render(<HomeImmersionCard />);
    expect(
      screen.getByRole("heading", { name: /¿viste algo en inglés hoy\?/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/video, serie, podcast, lectura/i)).toBeInTheDocument();

    const registerBtn = screen.getByRole("button", { name: /^registrar$/i });
    expect(registerBtn).toBeInTheDocument();

    fireEvent.click(registerBtn);

    expect(screen.getByRole("button", { name: /^video$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^serie$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^podcast$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^lectura$/i })).toBeInTheDocument();
  });

  it("allows selecting category and adjusting time when expanded", () => {
    render(<HomeImmersionCard />);
    fireEvent.click(screen.getByRole("button", { name: /^registrar$/i }));

    const podcastChip = screen.getByRole("button", { name: /^podcast$/i });
    fireEvent.click(podcastChip);
    expect(podcastChip.className).toContain("bg-primary-soft");

    const incrementBtn = screen.getByRole("button", { name: /aumentar tiempo/i });
    fireEvent.click(incrementBtn);
    expect(screen.getByText(/35/)).toBeInTheDocument();
  });

  it("updates state to registered on submit", () => {
    render(<HomeImmersionCard />);
    fireEvent.click(screen.getByRole("button", { name: /^registrar$/i }));

    const saveBtn = screen.getByRole("button", { name: /^guardar$/i });
    fireEvent.click(saveBtn);
    expect(screen.getByText("¡Registrado!")).toBeInTheDocument();
  });
});
