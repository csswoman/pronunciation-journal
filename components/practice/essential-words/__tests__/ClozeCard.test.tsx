// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClozeCard } from "../ClozeCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { selectSentence } from "@/lib/essential-words/sentence-variants";

vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));
vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));

const entry: EssentialWord = {
  rank: 67,
  word: "work",
  pos: "verb",
  ipa_strong: "/ˈwɜrk/",
  example_sentence: "She works at a hospital downtown every single day.",
  cefr_level: "A1",
  meaning: "to do a job",
  translation: "trabajar",
};

const withVariants: EssentialWord = {
  ...entry,
  example_sentences: [
    {
      sentence: "They work together on every big project at the office.",
      sentence_ipa: "/ðeɪ wɜrk təˈɡɛðər/",
    },
  ],
};

function setup(onAttempt = vi.fn().mockResolvedValue(undefined)) {
  render(<ClozeCard entry={entry} onAttempt={onAttempt} />);
  return onAttempt;
}

describe("ClozeCard", () => {
  it("shows the blanked sentence, not the answer", () => {
    setup();
    expect(
      screen.getByText("She ___ at a hospital downtown every single day."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^works$/)).not.toBeInTheDocument();
  });

  it("shows the translation as a hint", () => {
    setup();
    expect(screen.getByText(/trabajar/)).toBeInTheDocument();
  });

  it("calls onAttempt with a clean correct outcome", () => {
    const onAttempt = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "Works" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, hintsUsed: 0 }),
    );
  });

  it("accepts the base form too", () => {
    const onAttempt = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
  });

  it("wrong answer shows AnswerDiff before the repair attempt", () => {
    const onAttempt = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "sleeps" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onAttempt).not.toHaveBeenCalled();
    expect(screen.getByTestId("answer-diff-message")).toBeInTheDocument();
  });

  it("does not grade an empty answer", () => {
    const onAttempt = setup();
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onAttempt).not.toHaveBeenCalled();
  });

  it("prices the optional audio hint after a failed first attempt", () => {
    const onAttempt = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "wrongword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    fireEvent.click(screen.getByRole("button", { name: /intentar de nuevo/i }));
    fireEvent.click(screen.getByRole("button", { name: /pista/i })); // category, priced
    fireEvent.click(screen.getByRole("button", { name: /pista/i })); // audio, also priced for cloze
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: entry.word },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onAttempt.mock.calls[0][0].hintsUsed).toBeGreaterThan(0);
  });

  it("blanks and gives diff feedback against the selected variant sentence", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<ClozeCard entry={withVariants} onAttempt={onAttempt} repetitions={0} />);

    const expectedSentence = selectSentence(withVariants, 0).sentence;
    expect(expectedSentence).not.toBe(withVariants.example_sentence);

    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));

    expect(onAttempt).not.toHaveBeenCalled();
    expect(screen.getByTestId("answer-diff-message")).toHaveTextContent(/respuesta era "work"/i);
    expect(screen.queryByText(withVariants.example_sentence)).not.toBeInTheDocument();
  });
});
