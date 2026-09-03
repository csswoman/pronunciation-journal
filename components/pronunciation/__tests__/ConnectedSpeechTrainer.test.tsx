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

  it("switches to acoustic unpacking mode on click", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<ConnectedSpeechTrainer />);

    const unpackBtn = screen.getByText(/Desempaquetado Auditivo/i);
    fireEvent.click(unpackBtn);

    expect(screen.getByText("Desempaquetado Acústico")).toBeInTheDocument();
    expect(screen.getByText(/Velocidad nativa \(1\.0x\)/i)).toBeInTheDocument();
  });
});
