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
  targetCorrect: status === 'typo',
});

describe("AnswerDiff", () => {
  it("renders the correct sentence with the written mismatch below it", () => {
    render(<AnswerDiff feedback={feedback()} word="be" />);
    expect(screen.getByTestId("answer-diff-message")).toHaveTextContent(/Did he\?/);
    expect(screen.getByTestId("answer-diff-written")).toHaveTextContent(/you/);
  });

  it("marks a typo with a distinct semantic style", () => {
    render(<AnswerDiff feedback={feedback('typo')} word="happy" />);
    expect(screen.getByText(/he\?/)).toHaveClass('text-warning');
  });

  it("shows the explanation when one exists for the word", () => {
    render(<AnswerDiff feedback={feedback()} word="be" />);
    expect(screen.getByText(/am \/ is \/ are/i)).toBeInTheDocument();
    expect(screen.getByText('Escuchaste you, pero era he')).toBeInTheDocument();
  });

  it("shows no explanation text when none exists for the word", () => {
    render(<AnswerDiff feedback={feedback()} word="happy" />);
    expect(screen.queryByTestId("answer-diff-explanation")).not.toBeInTheDocument();
  });
});
