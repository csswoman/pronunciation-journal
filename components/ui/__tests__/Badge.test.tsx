// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "@/components/ui/Badge";

describe("Badge", () => {
  it("uses semantic token classes, not a fixed Tailwind palette", () => {
    const { container } = render(<Badge label="Recomendado" variant="default" />);
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("bg-badge-primary-bg");
    expect(badge?.className).not.toMatch(/bg-sky-|bg-violet-|bg-emerald-/);
    expect(screen.getByText("Recomendado")).toBeInTheDocument();
  });

  it("maps success and neutral without hue-locked colors", () => {
    const { rerender, container } = render(<Badge label="ON" variant="success" />);
    expect(container.firstElementChild?.className).toContain("bg-badge-success-bg");

    rerender(<Badge label="A2" variant="neutral" />);
    expect(container.firstElementChild?.className).toContain("text-fg-muted");
  });
});
