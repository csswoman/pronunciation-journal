// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
});
