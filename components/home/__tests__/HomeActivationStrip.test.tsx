// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomeActivationStrip from "@/components/home/HomeActivationStrip";

describe("HomeActivationStrip", () => {
  it("keeps practice as the primary path", () => {
    render(<HomeActivationStrip />);
    expect(
      screen.getByRole("heading", { name: /Una práctica ahora/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir laboratorio/i })).toHaveAttribute(
      "href",
      "/practice/sounds",
    );
  });

  it("shows a soft guest save cue without replacing the primary CTA", () => {
    render(<HomeActivationStrip showGuestSaveInline />);
    expect(screen.getByText(/Exploras sin cuenta permanente/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir laboratorio/i })).toBeInTheDocument();
  });
});
