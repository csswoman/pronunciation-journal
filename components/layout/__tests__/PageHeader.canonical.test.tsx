// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PageHeader from "@/components/layout/PageHeader";

describe("PageHeader canonical contract", () => {
  it("renders kicker → title → subtitle → primary action in order", () => {
    render(
      <PageHeader
        kicker="Practice"
        title="Sound Lab"
        subtitle="Elige un sonido para practicar"
        primaryCta={{ label: "Empezar", onClick: vi.fn() }}
      />,
    );

    const header = screen.getByRole("banner");
    expect(header.textContent).toMatch(/Practice[\s\S]*Sound Lab[\s\S]*Elige un sonido/);
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("does not use Fraunces/display font class on the title", () => {
    const { container } = render(<PageHeader title="Progress" />);
    const title = container.querySelector("h1");
    expect(title).not.toBeNull();
    expect(title!.className).not.toMatch(/font-display|font-fraunces/);
  });

  it("compact variant still exposes the same anatomy", () => {
    render(
      <PageHeader
        variant="compact"
        kicker="Sesión"
        title="Minimal pairs"
        subtitle="2 de 8"
        progress={25}
      />,
    );
    expect(screen.getByRole("banner").textContent).toMatch(/Sesión/);
    expect(screen.getByText("Minimal pairs")).toBeTruthy();
  });
});
