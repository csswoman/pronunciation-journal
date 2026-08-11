// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerDiff } from "../AnswerDiff";

const feedback = (status: 'error' | 'typo' = 'error') => ({
  words: [
    { expected: 'Did', written: 'did', status: 'match' as const, isTarget: false },
    { expected: 'he', written: status === 'typo' ? 'eh' : 'you', status, isTarget: true },
  ],
  extras: [],
  terminalPunctuation: '?',
  hasDifferences: true,
  hasTypos: status === 'typo',
  sentenceCorrect: status === 'typo',
  targetCorrect: status === 'typo',
});

describe("AnswerDiff", () => {
  it("marks an incorrect word answer with an explicit error state", () => {
    render(<AnswerDiff written="si" expected="hold" isTypo={false} word="hold" />);

    expect(screen.getByRole("status")).toHaveClass("bg-error-soft");
    expect(screen.getByText("No es esa palabra")).toHaveClass("text-error");
    expect(screen.getByTestId("answer-diff-message")).toHaveTextContent(/la respuesta era "hold"/i);
  });

  it("renders the written and correct words inline in the sentence", () => {
    render(<AnswerDiff feedback={feedback()} word="be" />);
    expect(screen.getByTestId("answer-diff-message")).toHaveTextContent(/Did youhe\?/);
    expect(screen.getByTestId("answer-diff-written")).toHaveTextContent(/you/);
  });

  it("marks a typo with correction semantics", () => {
    render(<AnswerDiff feedback={feedback('typo')} word="happy" />);
    expect(screen.getByTestId('answer-diff-written')).toHaveClass('text-error');
  });

  it("does not repeat a loose explanation below the inline correction", () => {
    render(<AnswerDiff feedback={feedback()} word="be" />);
    expect(screen.queryByTestId('answer-diff-explanation')).not.toBeInTheDocument();
  });

  it("shows no explanation text when none exists for the word", () => {
    render(<AnswerDiff feedback={feedback()} word="happy" />);
    expect(screen.queryByTestId("answer-diff-explanation")).not.toBeInTheDocument();
  });
});
