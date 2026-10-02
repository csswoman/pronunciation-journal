// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MinimalPairsRunner } from "../MinimalPairsRunner";

describe("MinimalPairsRunner", () => {
  it("renders minimal pair words and slow speed toggle button", () => {
    render(<MinimalPairsRunner initialContrastId="iː-ɪ" />);

    expect(screen.getByLabelText(/A: sheep/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/B: ship/i)).toBeInTheDocument();

    const slowBtn = screen.getByRole("button", { name: "0.7x" });
    expect(slowBtn).toBeInTheDocument();

    fireEvent.click(slowBtn);
    expect(slowBtn).toHaveClass("bg-white");
  });

  it("toggles auto-play loop mode in embedded mode", () => {
    render(<MinimalPairsRunner initialContrastId="iː-ɪ" embedded />);

    const loopBtn = screen.getByRole("button", { name: /Activar modo escucha continua/i });
    expect(loopBtn).toBeInTheDocument();

    fireEvent.click(loopBtn);
    expect(screen.getByRole("button", { name: /Pausar reproducción continua/i })).toBeInTheDocument();
  });
});
