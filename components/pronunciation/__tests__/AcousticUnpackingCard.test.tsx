// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AcousticUnpackingCard } from "../AcousticUnpackingCard";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";

vi.mock("@/lib/speech/synthesis", () => ({
  speakText: vi.fn(),
  cancelSpeech: vi.fn(),
}));

import { speakText } from "@/lib/speech/synthesis";

describe("AcousticUnpackingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPhrase: ConnectedPhrase = {
    id: "test-pick-it-up",
    phrase: "Pick it up",
    category: "linking-cv",
    categoryNameEs: "Enlace Consonante + Vocal",
    connectedIpa: "/ˈpɪ.kɪ.tʌp/",
    isolatedIpa: "/pɪk/ /ɪt/ /ʌp/",
    howItSoundsEs: "«pi-ki-tap»",
    explanationEs: "La consonante k se engancha a it.",
    linkedWords: ["Pick", "it"],
    linkSound: "k",
  };

  it("renders header and playback speed buttons", () => {
    render(<AcousticUnpackingCard phrase={mockPhrase} />);

    expect(screen.getByText("Desempaquetado Acústico")).toBeInTheDocument();
    expect(screen.getByText(/Velocidad nativa \(1\.0x\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Desacelerar \(0\.65x\)/i)).toBeInTheDocument();
  });

  it("plays audio at 1.0x and 0.65x", () => {
    render(<AcousticUnpackingCard phrase={mockPhrase} />);

    const normalBtn = screen.getByText(/Velocidad nativa \(1\.0x\)/i);
    fireEvent.click(normalBtn);
    expect(speakText).toHaveBeenCalledWith("Pick it up", expect.objectContaining({ rate: 1.0 }));

    const slowBtn = screen.getByText(/Desacelerar \(0\.65x\)/i);
    fireEvent.click(slowBtn);
    expect(speakText).toHaveBeenCalledWith("Pick it up", expect.objectContaining({ rate: 0.65 }));
  });

  it("selects correct answer, reveals acoustic map and calls onComplete", () => {
    const onComplete = vi.fn();
    render(<AcousticUnpackingCard phrase={mockPhrase} onComplete={onComplete} />);

    // Find the correct option
    const correctOption = screen.getByText(/«Pick it up» \(habla conectada natural\)/i);
    fireEvent.click(correctOption);

    expect(onComplete).toHaveBeenCalledWith(true);
    expect(screen.getByText("Mapa Acústico del Habla Conectada")).toBeInTheDocument();
    expect(screen.getByText("«pi-ki-tap»")).toBeInTheDocument();
  });

  it("allows revealing acoustic map directly without answering", () => {
    render(<AcousticUnpackingCard phrase={mockPhrase} />);

    const revealBtn = screen.getByText(/Revelar mapa acústico sin responder/i);
    fireEvent.click(revealBtn);

    expect(screen.getByText("Mapa Acústico del Habla Conectada")).toBeInTheDocument();
  });
});
