// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerDiff } from "../AnswerDiff";

describe("AnswerDiff", () => {
  it("shows what was written and what was expected, not just the correct answer alone", () => {
    render(<AnswerDiff written="bi" expected="be" isTypo={false} word="be" />);
    expect(screen.getByTestId("answer-diff-message")).toHaveTextContent(/bi/);
    expect(screen.getByTestId("answer-diff-message")).toHaveTextContent(/be/);
  });

  it("shows a gentler message for a typo than for a genuine miss", () => {
    const { unmount } = render(<AnswerDiff written="hapy" expected="happy" isTypo={true} word="happy" />);
    const typoText = screen.getByTestId("answer-diff-message").textContent;
    unmount();
    render(<AnswerDiff written="sad" expected="happy" isTypo={false} word="happy" />);
    const missText = screen.getByTestId("answer-diff-message").textContent;
    expect(typoText).not.toBe(missText);
  });

  it("shows the explanation when one exists for the word", () => {
    render(<AnswerDiff written="am" expected="be" isTypo={false} word="be" />);
    expect(screen.getByText(/am \/ is \/ are/i)).toBeInTheDocument();
  });

  it("shows no explanation text when none exists for the word", () => {
    render(<AnswerDiff written="sad" expected="happy" isTypo={false} word="happy" />);
    expect(screen.queryByTestId("answer-diff-explanation")).not.toBeInTheDocument();
  });
});
