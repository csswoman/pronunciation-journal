// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EarAndVoiceHero } from "../EarAndVoiceHero";

describe("EarAndVoiceHero", () => {
  it("renders 3 core focus pillars for pronunciation and listening", () => {
    const onSelectMinimalPairs = vi.fn();
    const onOpenIPA = vi.fn();

    render(
      <EarAndVoiceHero
        onSelectMinimalPairs={onSelectMinimalPairs}
        onOpenIPA={onOpenIPA}
      />,
    );

    expect(screen.getByText(/Gimnasio del Oído/i)).toBeInTheDocument();
    expect(screen.getByText(/Articulación y Voz/i)).toBeInTheDocument();
    expect(screen.getByText(/Curvas de Entonación/i)).toBeInTheDocument();
    expect(screen.getByTitle(/sheep \/ ship/i)).toBeInTheDocument();
  });
});
