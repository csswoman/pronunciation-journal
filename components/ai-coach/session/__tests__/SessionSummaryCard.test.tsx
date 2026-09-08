// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionSummaryCard from "../SessionSummaryCard";
import type { SessionSummaryArgs } from "@/lib/ai-practice/tools/registry";

const FULL: SessionSummaryArgs = {
  corrections: [{ original: "I go", corrected: "I went", rule: "Pasado simple" }],
  learned: [{ type: "word", text: "creepy", meaning: "escalofriante" }],
  reviewNext: ["Pasado simple irregular"],
};

const EMPTY: SessionSummaryArgs = { corrections: [], learned: [], reviewNext: [] };

describe("SessionSummaryCard", () => {
  it("shows the three sections when there is content for each", () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn()} />);
    expect(screen.getByText(/Corregimos/)).toBeInTheDocument();
    expect(screen.getByText(/Aprendiste/)).toBeInTheDocument();
    expect(screen.getByText(/Repasar/)).toBeInTheDocument();
  });

  it("shows both sides of each correction", () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn()} />);
    expect(screen.getByText("I go")).toBeInTheDocument();
    expect(screen.getByText("I went")).toBeInTheDocument();
  });

  it("hides a section that has no content", () => {
    render(
      <SessionSummaryCard summary={{ ...FULL, learned: [] }} onSaveAll={vi.fn()} />,
    );
    expect(screen.queryByText(/Aprendiste/)).not.toBeInTheDocument();
  });

  it("tells the user plainly when there was nothing to report", () => {
    render(<SessionSummaryCard summary={EMPTY} onSaveAll={vi.fn()} />);
    expect(screen.getByText(/sin correcciones/i)).toBeInTheDocument();
  });

  it("hides the save button when there is nothing to save", () => {
    render(<SessionSummaryCard summary={EMPTY} onSaveAll={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Guardar todo/ })).not.toBeInTheDocument();
  });

  it("hands every learned item to onSaveAll", async () => {
    const onSaveAll = vi.fn().mockResolvedValue(undefined);
    render(<SessionSummaryCard summary={FULL} onSaveAll={onSaveAll} />);
    await userEvent.click(screen.getByRole("button", { name: /Guardar todo/ }));
    expect(onSaveAll).toHaveBeenCalledWith(FULL.learned);
  });

  it("confirms and disables after saving", async () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn().mockResolvedValue(undefined)} />);
    await userEvent.click(screen.getByRole("button", { name: /Guardar todo/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Guardado/ })).toBeDisabled();
    });
  });

  it("offers a retry when saving fails", async () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn().mockRejectedValue(new Error("x"))} />);
    await userEvent.click(screen.getByRole("button", { name: /Guardar todo/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reintentar/i })).toBeEnabled();
    });
  });
});
