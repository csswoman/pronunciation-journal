// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { IntonationTrainer } from "../IntonationTrainer";

// Mock IntonationGraph canvas to prevent canvas errors in jsdom
vi.mock("../IntonationGraph", () => ({
  IntonationGraph: () => <div data-testid="mock-intonation-graph" />,
}));

describe("IntonationTrainer", () => {
  it("renders intonation pattern selector and target sentence", () => {
    render(<IntonationTrainer />);

    expect(screen.getAllByText("Ascendente ↗ (Pregunta Sí/No)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Are you ready\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Grabar mi entonación/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Siguiente oración/i })).toBeInTheDocument();
    expect(screen.getByTestId("mock-intonation-graph")).toBeInTheDocument();
  });
});
