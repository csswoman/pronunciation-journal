// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeImmersionCard from "@/components/home/HomeImmersionCard";

describe("HomeImmersionCard", () => {
  it("renders immersion log title and category options", () => {
    render(<HomeImmersionCard />);
    expect(screen.getByRole("heading", { name: /registrar inmersión/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^video$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^serie$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^podcast$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^lectura$/i })).toBeInTheDocument();
  });

  it("allows selecting category and adjusting time", () => {
    render(<HomeImmersionCard />);
    const podcastChip = screen.getByRole("button", { name: /^podcast$/i });
    fireEvent.click(podcastChip);
    expect(podcastChip.className).toContain("bg-primary-soft");

    const incrementBtn = screen.getByRole("button", { name: /aumentar tiempo/i });
    fireEvent.click(incrementBtn);
    expect(screen.getByText(/35/)).toBeInTheDocument();
  });

  it("updates state to registered on submit", () => {
    render(<HomeImmersionCard />);
    const registerBtn = screen.getByRole("button", { name: /^registrar$/i });
    fireEvent.click(registerBtn);
    expect(screen.getByText("¡Registrado!")).toBeInTheDocument();
  });
});
