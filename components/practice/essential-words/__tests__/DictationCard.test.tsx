// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DictationCard } from "../DictationCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { selectSentence } from "@/lib/essential-words/sentence-variants";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));
vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));

const entry: EssentialWord = {
  rank: 1,
  word: "through",
  pos: "preposition",
  ipa_strong: "θruː",
  example_sentence: "We walked through the park.",
  cefr_level: "A1",
};

describe("DictationCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not reveal the sentence before answering", () => {
    render(<DictationCard entry={entry} onAttempt={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.queryByText(entry.example_sentence)).not.toBeInTheDocument();
  });

  it("calls onAttempt with a clean first-try outcome", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "we walked through the park" },
    });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false, firstTryFailed: false }),
    );
  });

  it("shows diff feedback on the first wrong answer and grades the repaired attempt", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "totally wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onAttempt).not.toHaveBeenCalled();
    expect(screen.getByTestId("answer-diff-message")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /intentar de nuevo/i }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: entry.example_sentence },
    });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, firstTryFailed: true }),
    );
  });

  it("does not submit an empty answer", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onAttempt).not.toHaveBeenCalled();
  });

  const withVariants: EssentialWord = {
    ...entry,
    example_sentences: [
      { sentence: "We walked home slowly.", sentence_ipa: "/wi wɔkt hoʊm sloʊli/" },
    ],
  };

  it("grades against the selected variant, not always the base sentence", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={withVariants} repetitions={0} onAttempt={onAttempt} />);

    const expected = selectSentence(withVariants, 0).sentence;
    fireEvent.change(screen.getByRole("textbox"), { target: { value: expected } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));

    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
  });

  it("shows the selected sentence in the feedback after a wrong answer", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={withVariants} repetitions={1} onAttempt={onAttempt} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "something wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));

    expect(screen.getByTestId("answer-diff-message")).toHaveTextContent(
      selectSentence(withVariants, 1).sentence,
    );
  });

  it("treats a typo answer as correct without penalty", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "We wlaked through the park." } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ typo: true, correct: true }));
  });

  it("audio replay via ListenButton does not increment hintsUsed", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.click(screen.getByRole("button", { name: /escuchar de nuevo/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: entry.example_sentence } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ hintsUsed: 0 }));
  });

  it("records latencyMs on the outcome", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: entry.example_sentence } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    const call = onAttempt.mock.calls[0][0];
    expect(typeof call.latencyMs).toBe("number");
    expect(call.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
