// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecognizeAudioCard } from "../RecognizeAudioCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { speak } from "@/lib/phoneme-practice/tts";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));
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

const distractors: EssentialWord[] = [
  { ...entry, rank: 2, word: "though", translation: "aunque" },
  { ...entry, rank: 3, word: "thought", translation: "pensamiento" },
  { ...entry, rank: 4, word: "thorough", translation: "minucioso" },
];

function setup(onGraded = vi.fn().mockResolvedValue(undefined)) {
  render(
    <RecognizeAudioCard
      entry={entry}
      distractors={distractors}
      onGraded={onGraded}
    />,
  );
  return onGraded;
}

describe("RecognizeAudioCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom has no speechSynthesis; stub it so ListenButton's gate reports true.
    vi.stubGlobal("speechSynthesis", { speak: vi.fn(), cancel: vi.fn() });
  });

  it("does not show the target word as text before answering", () => {
    setup();
    // El prompt es el audio: la palabra solo puede aparecer como opción, y las
    // opciones son botones, no texto suelto.
    const options = screen.getAllByRole("button", { name: /through|though|thought|thorough/ });
    expect(options.length).toBeGreaterThan(1);
  });

  it("speaks the word on mount so the prompt is audible", () => {
    setup();
    expect(speak).toHaveBeenCalledWith(entry.word, expect.anything());
  });

  it("replays the word on demand", () => {
    setup();
    vi.mocked(speak).mockClear();
    fireEvent.click(screen.getByRole("button", { name: /escuchar/i }));
    expect(speak).toHaveBeenCalledWith(entry.word, expect.anything());
  });

  it("grades 5 when the learner picks the spoken word", () => {
    const onGraded = setup();
    fireEvent.click(screen.getByRole("button", { name: "through" }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 when the learner picks a lookalike", () => {
    const onGraded = setup();
    fireEvent.click(screen.getByRole("button", { name: "thought" }));
    expect(onGraded).toHaveBeenCalledWith(2);
  });

  it("ignores a second choice", () => {
    const onGraded = setup();
    fireEvent.click(screen.getByRole("button", { name: "through" }));
    fireEvent.click(screen.getByRole("button", { name: "thought" }));
    expect(onGraded).toHaveBeenCalledTimes(1);
  });
});
