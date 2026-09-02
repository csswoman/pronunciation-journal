// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ContentFunctionEarTrainer from "../ContentFunctionEarTrainer";

const speakTextMock = vi.fn();
const cancelSpeechMock = vi.fn();

vi.mock("@/lib/speech/synthesis", () => ({
  speakText: (...args: unknown[]) => speakTextMock(...args),
  cancelSpeech: () => cancelSpeechMock(),
}));

describe("ContentFunctionEarTrainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trainer header, controls and words", () => {
    render(<ContentFunctionEarTrainer />);
    expect(screen.getByText(/Entrenador de Discriminación Acústica/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Escuchar \(1.0x\)/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Lento \(0.65x\)/i })).toBeDefined();
  });

  it("plays audio when play button is clicked", () => {
    render(<ContentFunctionEarTrainer />);
    const playBtn = screen.getByRole("button", { name: /Escuchar \(1.0x\)/i });
    fireEvent.click(playBtn);
    expect(cancelSpeechMock).toHaveBeenCalled();
    expect(speakTextMock).toHaveBeenCalledWith(
      expect.stringContaining("I can go to the store"),
      expect.objectContaining({ rate: 1.0 })
    );
  });

  it("allows selecting word tokens and revealing acoustic map", () => {
    render(<ContentFunctionEarTrainer />);
    const goWordBtn = screen.getByRole("button", { name: /go/i });
    fireEvent.click(goWordBtn);
    expect(goWordBtn.getAttribute("aria-pressed")).toBe("true");

    const revealBtn = screen.getByRole("button", { name: /Revelar mapa acústico/i });
    fireEvent.click(revealBtn);

    expect(screen.getByText(/Palabras de contenido \(Acentuadas\)/i)).toBeDefined();
    expect(screen.getByText(/Formas débiles y reducciones/i)).toBeDefined();
  });
});
