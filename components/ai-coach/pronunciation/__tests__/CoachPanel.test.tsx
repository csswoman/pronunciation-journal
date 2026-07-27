// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/components/ui/ListenButton", () => ({
  ListenButton: ({ onPlay, label }: { onPlay: () => void; label: string }) => (
    <button type="button" onClick={onPlay}>{label}</button>
  ),
}));
import CoachPanel from "../CoachPanel";

const focus = {
  word: "Thursday",
  phoneme: "TH",
  ipa: "theta",
};

describe("CoachPanel", () => {
  it("plays the focused word from the listen button", () => {
    const onListen = vi.fn();

    render(
      <CoachPanel
        focus={focus}
        focusTip="Place your tongue behind your teeth."
        focusProgress={{ correct: 1, total: 3 }}
        savedWords={new Set()}
        onListen={onListen}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Listen to this sound" }));

    expect(onListen).toHaveBeenCalledWith("Thursday");
  });

  it("saves the focused word once", () => {
    const onSave = vi.fn();

    render(
      <CoachPanel
        focus={focus}
        focusTip={null}
        focusProgress={null}
        savedWords={new Set()}
        onListen={vi.fn()}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save for practice" }));

    expect(onSave).toHaveBeenCalledWith("Thursday");
  });

  describe("with the actionable feedback copy flag disabled", () => {
    afterEach(() => {
      delete process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY;
    });

    it("hides the phoneme claim and tip but keeps the controls working", () => {
      process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY = "false";
      const onListen = vi.fn();
      const onSlow = vi.fn();
      const onRetry = vi.fn();

      render(
        <CoachPanel
          focus={focus}
          focusTip="Place your tongue behind your teeth."
          focusProgress={{ correct: 1, total: 3 }}
          savedWords={new Set()}
          onListen={onListen}
          onSlow={onSlow}
          onSave={vi.fn()}
          onRetry={onRetry}
        />,
      );

      expect(screen.queryByText("/theta/")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Place your tongue behind your teeth."),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("in focus")).not.toBeInTheDocument();
      expect(screen.getByText("Thursday", { exact: false })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Escuchar modelo" }));
      expect(onListen).toHaveBeenCalledWith("Thursday");

      fireEvent.click(screen.getByRole("button", { name: "Más lento" }));
      expect(onSlow).toHaveBeenCalledWith("Thursday");

      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
      expect(onRetry).toHaveBeenCalled();
    });
  });
});
