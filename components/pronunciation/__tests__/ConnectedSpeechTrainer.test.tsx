// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ConnectedSpeechTrainer } from "../ConnectedSpeechTrainer";

describe("ConnectedSpeechTrainer", () => {
  it("renders connected speech phrase and phonetic link", () => {
    render(<ConnectedSpeechTrainer />);

    expect(screen.getByText(/Pick it up/i)).toBeInTheDocument();
    expect(screen.getByText(/Enlace Fonético en Acción/i)).toBeInTheDocument();
    expect(screen.getByText(/Habla conectada nativa:/i)).toBeInTheDocument();
    expect(screen.getByText("«pi-ki-tap»")).toBeInTheDocument();
  });
});
