// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WeakFormCard } from "../WeakFormCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { speak } from "@/lib/phoneme-practice/tts";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));

const entry: EssentialWord = {
  rank: 1,
  word: "to",
  pos: "preposition",
  ipa_strong: "tuː",
  ipa_weak: "tə",
  sentence_ipa: "aɪ wɒnt tə goʊ",
  example_sentence: "I want to go.",
  cefr_level: "A1",
};

describe("WeakFormCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom has no speechSynthesis; stub it so ListenButton's availability gate reports true.
    vi.stubGlobal("speechSynthesis", { speak: vi.fn(), cancel: vi.fn() });
  });

  it("shows both the strong and weak pronunciations", () => {
    render(<WeakFormCard entry={entry} onGraded={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText(/tuː/)).toBeInTheDocument();
    expect(screen.getByText(/tə/)).toBeInTheDocument();
  });

  it("plays the weak form in its phrase context", () => {
    render(<WeakFormCard entry={entry} onGraded={vi.fn().mockResolvedValue(undefined)} />);
    fireEvent.click(screen.getByRole("button", { name: /escuchar/i }));
    expect(speak).toHaveBeenCalled();
  });

  it("submits the learner self-grade", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<WeakFormCard entry={entry} onGraded={onGraded} />);
    fireEvent.click(screen.getByRole("button", { name: /lo dije bien/i }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });
});
