// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecallTranslationCard } from "../RecallTranslationCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { selectSentence } from "@/lib/essential-words/sentence-variants";

vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));
vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));

const entry: EssentialWord = {
  rank: 1,
  word: "through",
  pos: "preposition",
  ipa_strong: "θruː",
  example_sentence: "We walked through the park.",
  cefr_level: "A1",
  translation: "a través de",
};

function setup(
  onAttempt = vi.fn().mockResolvedValue(undefined),
  e: EssentialWord = entry,
  repetitions?: number,
) {
  render(
    <RecallTranslationCard entry={e} repetitions={repetitions} onAttempt={onAttempt} />,
  );
  return onAttempt;
}

function answer(value: string) {
  fireEvent.change(screen.getByLabelText("Escribe la palabra en inglés"), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
}

describe("RecallTranslationCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the Spanish prompt", () => {
    setup();
    expect(screen.getByText("a través de")).toBeInTheDocument();
  });

  it("does not reveal the English word before answering", () => {
    setup();
    expect(screen.queryByText("through")).not.toBeInTheDocument();
  });

  it("calls onAttempt with a correct outcome for the right word", () => {
    const onAttempt = setup();
    answer("  Through ");
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false }),
    );
  });

  it("shows AnswerDiff on a wrong word before grading a repair", () => {
    const onAttempt = setup();
    answer("though");
    expect(onAttempt).not.toHaveBeenCalled();
    expect(screen.getByTestId("answer-diff-message")).toBeInTheDocument();
  });

  it("shows the example sentence as context after a correct answer", () => {
    setup();
    answer("through");
    expect(screen.getByText(entry.example_sentence)).toBeInTheDocument();
  });

  it("does not grade an empty answer", () => {
    const onAttempt = setup();
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onAttempt).not.toHaveBeenCalled();
  });

  it("prices hints after the first failed attempt", () => {
    const onAttempt = setup();
    answer("though");
    fireEvent.click(screen.getByRole("button", { name: /intentar de nuevo/i }));
    fireEvent.click(screen.getByRole("button", { name: /pista/i }));
    answer("through");
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ hintsUsed: 1 }));
  });

  describe("sentence rotation", () => {
    const withVariants: EssentialWord = {
      ...entry,
      example_sentences: [
        { sentence: "He drove through a long tunnel.", sentence_ipa: "/hi droʊv θru ə lɔŋ ˈtʌnəl/" },
        { sentence: "Water flows through the pipe.", sentence_ipa: "/ˈwɔtər floʊz θru ðə paɪp/" },
      ],
    };

    it("reveals the selected variant as context, not always the base sentence", () => {
      setup(undefined, withVariants, 1);
      answer("through");
      expect(
        screen.getByText(selectSentence(withVariants, 1).sentence),
      ).toBeInTheDocument();
    });

    it("shows a different context sentence across repetitions", () => {
      const seen = new Set<string>();
      for (const reps of [0, 1, 2]) {
        const { unmount } = render(
          <RecallTranslationCard
            entry={withVariants}
            repetitions={reps}
            onAttempt={vi.fn().mockResolvedValue(undefined)}
          />,
        );
        answer("through");
        seen.add(selectSentence(withVariants, reps).sentence);
        unmount();
      }
      expect(seen.size).toBeGreaterThan(1);
    });

    it("defaults to the base sentence when no repetitions are passed", () => {
      setup(undefined, withVariants);
      answer("through");
      expect(screen.getByText(withVariants.example_sentence)).toBeInTheDocument();
    });
  });
});
