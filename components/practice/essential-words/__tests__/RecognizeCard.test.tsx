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

const distractors = [
  word({ word: "under", translation: "debajo de" }),
  word({ word: "over", translation: "encima de" }),
  word({ word: "into", translation: "hacia dentro de" }),
];

describe("RecognizeCard", () => {
  it("shows the imperative instruction, prompt box, and four options", () => {
    render(
      <RecognizeCard
        entry={word()}
        distractors={distractors}
        mode="recognize_translation"
        levelLabel="Reconocer"
        onAttempt={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText("Reconocer")).toBeInTheDocument();
    expect(screen.getByText("Elige la palabra que significa esto")).toBeInTheDocument();
    expect(screen.getByText("a través de")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /\d+\./ })).toHaveLength(4);
  });

  it("capitalizes the pronoun i in options", () => {
    render(
      <RecognizeCard
        entry={word({ word: "i", pos: "pronoun", translation: "yo", example_sentence: "I am ready now." })}
        distractors={[
          word({ word: "you", pos: "pronoun", translation: "tú", example_sentence: "Did you see that?" }),
          word({ word: "we", pos: "pronoun", translation: "nosotros", example_sentence: "We are here." }),
          word({ word: "he", pos: "pronoun", translation: "él", example_sentence: "He is tall." }),
        ]}
        onAttempt={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText('Elige el pronombre que completa la oración')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: / I$/ })).toBeInTheDocument();
  });

  it("calls onAttempt with correct=true and no hints for the correct choice", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        distractors={distractors}
        mode="recognize_translation"
        onAttempt={onAttempt}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false }),
    );
  });

  it("calls onAttempt with correct=false and rescued=false for a wrong pick", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        distractors={distractors}
        mode="recognize_translation"
        onAttempt={onAttempt}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /under/ }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: false, rescued: false }),
    );
  });

  it("records latencyMs", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        distractors={distractors}
        mode="recognize_translation"
        onAttempt={onAttempt}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    expect(typeof onAttempt.mock.calls[0][0].latencyMs).toBe("number");
  });

  it("shows the feedback banner after choosing, without auto-advancing", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        distractors={distractors}
        mode="recognize_translation"
        onAttempt={onAttempt}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    expect(screen.getByText(/¡correcto!/i)).toBeInTheDocument();
  });

  it("renders the Continuar button inside the card when onContinue is provided", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    const onContinue = vi.fn();
    render(
      <RecognizeCard
        entry={word()}
        distractors={distractors}
        mode="recognize_translation"
        onAttempt={onAttempt}
        onContinue={onContinue}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    const continueButton = screen.getByRole("button", { name: "Continuar" });
    fireEvent.click(continueButton);
    expect(onContinue).toHaveBeenCalled();
  });

  it("does not render Continuar before a choice is made", () => {
    render(
      <RecognizeCard
        entry={word()}
        distractors={distractors}
        mode="recognize_translation"
        onAttempt={vi.fn().mockResolvedValue(undefined)}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
  });

  it("never renders a duplicate option label", () => {
    render(
      <RecognizeCard
        entry={word()}
        distractors={[
          word({ word: "through", translation: "a través de" }),
          word({ word: "over", translation: "encima de" }),
          word({ word: "into", translation: "hacia dentro de" }),
        ]}
        mode="recognize_translation"
        onAttempt={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    const labels = screen.getAllByRole("button").map((b) => b.textContent?.replace(/^\d+/, "").trim());
    expect(new Set(labels).size).toBe(labels.length);
  });
});
