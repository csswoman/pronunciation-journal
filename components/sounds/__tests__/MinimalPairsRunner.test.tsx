// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MinimalPairsRunner } from "../MinimalPairsRunner";

describe("MinimalPairsRunner", () => {
  it("renders minimal pair words and slow speed toggle button", () => {
    render(<MinimalPairsRunner initialContrastId="iː-ɪ" />);

    expect(screen.getByLabelText(/A: sheep/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/B: ship/i)).toBeInTheDocument();

    const speedBtn = screen.getByRole("button", { name: /Cambiar a velocidad lenta/i });
    expect(speedBtn).toBeInTheDocument();

    fireEvent.click(speedBtn);
    expect(screen.getByRole("button", { name: /Velocidad lenta activa/i })).toBeInTheDocument();
  });

  it("toggles auto-play loop mode", () => {
    render(<MinimalPairsRunner initialContrastId="iː-ɪ" />);

    const loopBtn = screen.getByRole("button", { name: /Activar modo escucha continua/i });
    expect(loopBtn).toBeInTheDocument();

    fireEvent.click(loopBtn);
    expect(screen.getByRole("button", { name: /Pausar reproducción continua/i })).toBeInTheDocument();
  });
});
