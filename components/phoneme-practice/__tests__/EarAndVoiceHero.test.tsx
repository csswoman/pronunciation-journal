// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EarAndVoiceHero } from "../EarAndVoiceHero";

describe("EarAndVoiceHero", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders 3 core focus pillars for pronunciation and listening", () => {
    const onSelectMinimalPairs = vi.fn();

    render(
      <EarAndVoiceHero
        onSelectMinimalPairs={onSelectMinimalPairs}
      />,
    );

    expect(screen.getByText(/Gimnasio del Oído/i)).toBeInTheDocument();
    expect(screen.getByText(/Articulación y Voz/i)).toBeInTheDocument();
    expect(screen.getByText(/Curvas de Entonación/i)).toBeInTheDocument();
    expect(screen.getByTitle(/sheep \/ ship/i)).toBeInTheDocument();
  });

  it("can be dismissed and restored", () => {
    const onSelectMinimalPairs = vi.fn();

    render(
      <EarAndVoiceHero
        onSelectMinimalPairs={onSelectMinimalPairs}
      />,
    );

    const dismissButton = screen.getByRole("button", { name: /ocultar guía/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/Gimnasio del Oído/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Guía de entrenamiento/i)).toBeInTheDocument();
    expect(localStorage.getItem("sound_lab_hero_dismissed")).toBe("true");

    const restoreButton = screen.getByRole("button", { name: /mostrar guía de entrenamiento/i });
    fireEvent.click(restoreButton);

    expect(screen.getByText(/Gimnasio del Oído/i)).toBeInTheDocument();
    expect(localStorage.getItem("sound_lab_hero_dismissed")).toBeNull();
  });
});
