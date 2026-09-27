// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ConnectedSpeechTrainer } from "../ConnectedSpeechTrainer";

describe("ConnectedSpeechTrainer", () => {
  it("renders setup screen with category options and start CTA", () => {
    render(<ConnectedSpeechTrainer />);

    expect(screen.getByText("1 · QUÉ QUIERES PRACTICAR")).toBeInTheDocument();
    expect(screen.getByText("2 · CÓMO QUIERES EMPEZAR")).toBeInTheDocument();
    expect(screen.getByText("Todos los enlaces")).toBeInTheDocument();
    expect(screen.getByText("Empezar")).toBeInTheDocument();
  });

  it("starts session when clicking Empezar", () => {
    render(<ConnectedSpeechTrainer />);

    const startBtn = screen.getByText("Empezar");
    fireEvent.click(startBtn);

    expect(screen.getByText(/¿Qué frase escuchaste\?/i)).toBeInTheDocument();
    expect(screen.getByText("Pick it up")).toBeInTheDocument();
  });
});
