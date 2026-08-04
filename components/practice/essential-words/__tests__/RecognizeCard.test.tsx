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
        onGraded={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText("a través de")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /through|under|over|into/ })).toHaveLength(4);
  });

  it("grades 5 when the correct word is chosen", async () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onGraded={onGraded}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "through" }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 when a wrong word is chosen", async () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onGraded={onGraded}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "under" }));
    expect(onGraded).toHaveBeenCalledWith(2);
  });

  it("never renders a duplicate option label", () => {
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={[word({ word: "through" }), word({ word: "over" }), word({ word: "into" })]}
        onGraded={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
