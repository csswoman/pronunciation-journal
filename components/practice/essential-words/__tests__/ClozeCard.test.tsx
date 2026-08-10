// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClozeCard } from "../ClozeCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { selectProductionClozeSentence, selectSentence } from "@/lib/essential-words/sentence-variants";

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

  it("focuses the answer input when the exercise opens", () => {
    setup();
    expect(screen.getByLabelText("Escribe la palabra que falta")).toHaveFocus();
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

  it("shows the correct feedback banner and a Continuar action once resolved", () => {
    const onAttempt = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onAttempt).toHaveBeenCalled();
    expect(screen.getByText(/¡correcto!/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
  });

  it("renders the Continuar button inside the card when onContinue is provided", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    const onContinue = vi.fn();
    render(<ClozeCard entry={entry} onAttempt={onAttempt} onContinue={onContinue} />);
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    const continueButton = screen.getByRole("button", { name: "Continuar" });
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    expect(onContinue).toHaveBeenCalled();
  });

  it("uses the next Enter for continuation after showing feedback", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    const onContinue = vi.fn();
    render(<ClozeCard entry={entry} onAttempt={onAttempt} onContinue={onContinue} />);
    const input = screen.getByLabelText("Escribe la palabra que falta");

    fireEvent.change(input, { target: { value: "work" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText(/¡correcto!/i)).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("does not show the feedback banner during the first-attempt repair prompt", () => {
    setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "sleeps" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(screen.queryByText(/¡correcto!|no exactamente/i)).not.toBeInTheDocument();
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

  it("does not render a written cloze from an excluded ambiguous variant", () => {
    const program: EssentialWord = {
      ...entry,
      word: "program",
      pos: "noun",
      example_sentence: "The program starts Monday.",
      example_sentences: [{
        sentence: "The TV program will start soon.",
        sentence_ipa: "/ðə tiːviː proʊɡræm wɪl stɑrt suːn/",
      }],
    };
    expect(selectSentence(program, 1).sentence).toBe("The TV program will start soon.");
    expect(selectProductionClozeSentence(program, 1)?.sentence).toBe("The program starts Monday.");

    render(<ClozeCard entry={program} repetitions={1} onAttempt={vi.fn()} />);

    expect(screen.getByText("The ___ starts Monday.")).toBeInTheDocument();
    expect(screen.queryByText("The TV ___ will start soon.")).not.toBeInTheDocument();
  });
});
