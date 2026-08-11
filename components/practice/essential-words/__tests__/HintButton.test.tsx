// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HintButton } from "../HintButton";
import type { HintRung } from "@/lib/essential-words/hint-ladder";

const ladder: HintRung[] = [
  { kind: "category", content: "La respuesta es un adjetivo y tiene 5 letras.", priced: true, isGiveUp: false },
  { kind: "audio", content: "Escuchar la palabra", priced: true, isGiveUp: false },
  { kind: "reveal", content: "happy", priced: false, isGiveUp: true },
];

describe("HintButton", () => {
  it("is not rendered before the first failed attempt or idle timeout", () => {
    render(<HintButton ladder={ladder} hasFailedOnce={false} idleMs={0} onAdvance={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /pista/i })).not.toBeInTheDocument();
  });

  it("renders once hasFailedOnce is true", () => {
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={vi.fn()} />);
    expect(screen.getByRole("button", { name: /pista/i })).toBeInTheDocument();
  });

  it("clicking advances to the next rung and calls onAdvance with that rung", () => {
    const onAdvance = vi.fn();
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={onAdvance} />);
    fireEvent.click(screen.getByRole("button", { name: /pista/i }));
    expect(onAdvance).toHaveBeenCalledWith(ladder[0]);
    expect(screen.getByText("La respuesta es un adjetivo y tiene 5 letras.")).toBeInTheDocument();
  });

  it("clicking again advances through subsequent rungs in order", () => {
    const onAdvance = vi.fn();
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={onAdvance} />);
    const button = screen.getByRole("button", { name: /pista/i });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onAdvance).toHaveBeenNthCalledWith(1, ladder[0]);
    expect(onAdvance).toHaveBeenNthCalledWith(2, ladder[1]);
  });

  it("does not advance past the last rung", () => {
    const onAdvance = vi.fn();
    render(<HintButton ladder={[ladder[0]]} hasFailedOnce={true} idleMs={0} onAdvance={onAdvance} />);
    const button = screen.getByRole("button", { name: /pista/i });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when the ladder is empty (multiple-choice modes have no hints)", () => {
    render(<HintButton ladder={[]} hasFailedOnce={true} idleMs={0} onAdvance={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("is discrete: not styled as a colored/primary action button", () => {
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={vi.fn()} />);
    const button = screen.getByRole("button", { name: /pista/i });
    expect(button.className).not.toMatch(/primary/);
  });
});
