// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecognizeCard } from "../RecognizeCard";
import type { EssentialWord } from "@/lib/essential-words/types";

function word(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "through",
    pos: "preposition",
    ipa_strong: "θruː",
    example_sentence: "We walked through the park.",
    cefr_level: "A1",
    translation: "a través de",
    ...overrides,
  };
}

const distractors = [word({ word: "under" }), word({ word: "over" }), word({ word: "into" })];

describe("RecognizeCard", () => {
  it("shows the prompt and four options", () => {
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onAttempt={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText("a través de")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /through|under|over|into/ })).toHaveLength(4);
  });

  it("calls onAttempt with correct=true and no hints for the correct choice", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onAttempt={onAttempt}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "through" }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false }),
    );
  });

  it("calls onAttempt with correct=false and rescued=false for a wrong pick", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onAttempt={onAttempt}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "under" }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: false, rescued: false }),
    );
  });

  it("records latencyMs", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onAttempt={onAttempt}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "through" }));
    expect(typeof onAttempt.mock.calls[0][0].latencyMs).toBe("number");
  });

  it("never renders a duplicate option label", () => {
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={[word({ word: "through" }), word({ word: "over" }), word({ word: "into" })]}
        onAttempt={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
