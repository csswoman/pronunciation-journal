// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TriageActionHints } from "../TriageActionHints";

describe("TriageActionHints", () => {
  it("renders buttons for 'Ya la sé' and 'No la sé'", () => {
    const onKnown = vi.fn();
    const onSkip = vi.fn();

    render(
      <TriageActionHints
        onKnown={onKnown}
        onSkip={onSkip}
        canUndo={false}
      />
    );

    expect(screen.getByRole("button", { name: /ya la sé/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /no la sé/i })).toBeDefined();
  });

  it("calls onKnown when 'Ya la sé' button is clicked", () => {
    const onKnown = vi.fn();
    const onSkip = vi.fn();

    render(
      <TriageActionHints
        onKnown={onKnown}
        onSkip={onSkip}
        canUndo={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /ya la sé/i }));
    expect(onKnown).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("calls onSkip when 'No la sé' button is clicked", () => {
    const onKnown = vi.fn();
    const onSkip = vi.fn();

    render(
      <TriageActionHints
        onKnown={onKnown}
        onSkip={onSkip}
        canUndo={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /no la sé/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onKnown).not.toHaveBeenCalled();
  });

  it("handles ArrowLeft and ArrowRight keyboard events", () => {
    const onKnown = vi.fn();
    const onSkip = vi.fn();

    render(
      <TriageActionHints
        onKnown={onKnown}
        onSkip={onSkip}
        canUndo={false}
      />
    );

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onKnown).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("renders undo button and responds to onUndo and z key when canUndo is true", () => {
    const onKnown = vi.fn();
    const onSkip = vi.fn();
    const onUndo = vi.fn();

    render(
      <TriageActionHints
        onKnown={onKnown}
        onSkip={onSkip}
        onUndo={onUndo}
        canUndo={true}
      />
    );

    const undoBtn = screen.getByRole("button", { name: /deshacer/i });
    expect(undoBtn).toBeDefined();

    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "z" });
    expect(onUndo).toHaveBeenCalledTimes(2);
  });
});
