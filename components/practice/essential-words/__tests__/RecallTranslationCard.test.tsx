// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecallTranslationCard } from "../RecallTranslationCard";
import type { EssentialWord } from "@/lib/essential-words/types";

vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));

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
  onGraded = vi.fn().mockResolvedValue(undefined),
  e: EssentialWord = entry,
) {
  render(<RecallTranslationCard entry={e} onGraded={onGraded} />);
  return onGraded;
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

  it("grades 5 for the right word ignoring case and spacing", () => {
    const onGraded = setup();
    answer("  Through ");
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 for a wrong word and reveals the answer", () => {
    const onGraded = setup();
    answer("though");
    expect(onGraded).toHaveBeenCalledWith(2);
    expect(screen.getByText("through")).toBeInTheDocument();
  });

  it("shows the example sentence as context after answering", () => {
    setup();
    answer("through");
    expect(screen.getByText(entry.example_sentence)).toBeInTheDocument();
  });

  it("does not grade an empty answer", () => {
    const onGraded = setup();
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).not.toHaveBeenCalled();
  });
});
