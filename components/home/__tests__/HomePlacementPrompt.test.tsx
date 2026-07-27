// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePlacementPrompt from "@/components/home/HomePlacementPrompt";

describe("HomePlacementPrompt", () => {
  it("presents placement as the setup action for a new learner", () => {
    render(<HomePlacementPrompt />);

    expect(screen.getByRole("heading", { name: "Empieza el plan desde tu nivel" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hacer prueba de nivel/i }))
      .toHaveAttribute("href", "/assessment");
  });

  it("uses a quieter reminder after practice already exists", () => {
    render(<HomePlacementPrompt compact />);

    expect(screen.getByRole("heading", { name: "Afina tu nivel" })).toBeInTheDocument();
  });
});
