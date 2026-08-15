// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MinimalPairsRunner } from "../MinimalPairsRunner";

describe("MinimalPairsRunner", () => {
  it("renders minimal pair words and slow speed toggle button", () => {
    render(<MinimalPairsRunner initialContrastId="iː-ɪ" />);

    expect(screen.getByText("sheep")).toBeInTheDocument();
    expect(screen.getByText("ship")).toBeInTheDocument();

    const speedBtn = screen.getByRole("button", { name: /Cambiar a velocidad lenta/i });
    expect(speedBtn).toBeInTheDocument();

    fireEvent.click(speedBtn);
    expect(screen.getByRole("button", { name: /Velocidad lenta activa/i })).toBeInTheDocument();
  });
});
