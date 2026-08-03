// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DictationCard } from "../DictationCard";
import type { EssentialWord } from "@/lib/essential-words/types";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));

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
    render(<DictationCard entry={entry} onGraded={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.queryByText(entry.example_sentence)).not.toBeInTheDocument();
  });

  it("grades 5 for an exact match ignoring case and punctuation", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onGraded={onGraded} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "we walked through the park" },
    });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 for a wrong answer and reveals the sentence", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onGraded={onGraded} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "totally wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onGraded).toHaveBeenCalledWith(2);
    expect(screen.getByText(entry.example_sentence)).toBeInTheDocument();
  });

  it("does not submit an empty answer", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onGraded={onGraded} />);
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onGraded).not.toHaveBeenCalled();
  });
});
