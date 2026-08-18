// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { IntonationGraph } from "../IntonationGraph";
import { INTONATION_PATTERNS } from "@/lib/speech/intonation-patterns";

describe("IntonationGraph", () => {
  it("renders target curve and word labels", () => {
    const pattern = INTONATION_PATTERNS[0];
    render(<IntonationGraph targetCurve={pattern.targetCurve} />);

    expect(screen.getByText("Curva objetivo")).toBeInTheDocument();
    expect(screen.getByText("Tu tono de voz")).toBeInTheDocument();
    expect(screen.getByText("Are")).toBeInTheDocument();
    expect(screen.getByText("dy? ↗")).toBeInTheDocument();
  });

  it("shows recording status badge when isRecording is true", () => {
    const pattern = INTONATION_PATTERNS[0];
    render(<IntonationGraph targetCurve={pattern.targetCurve} isRecording />);

    expect(screen.getByText("Escuchando tu entonación…")).toBeInTheDocument();
  });
});
