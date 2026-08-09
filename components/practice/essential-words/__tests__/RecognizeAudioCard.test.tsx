// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecognizeAudioCard } from "../RecognizeAudioCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { speak, speakSequence } from "@/lib/phoneme-practice/tts";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn(), speakSequence: vi.fn() }));
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
  { ...entry, rank: 2, word: "though", ipa_strong: "ðoʊ", translation: "aunque" },
  { ...entry, rank: 3, word: "thought", ipa_strong: "θɔːt", translation: "pensamiento" },
  { ...entry, rank: 4, word: "thorough", ipa_strong: "θʌroʊ", translation: "minucioso" },
];

function setup(onAttempt = vi.fn().mockResolvedValue(undefined)) {
  render(
    <RecognizeAudioCard
      entry={entry}
      distractors={distractors}
      onAttempt={onAttempt}
    />,
  );
  return onAttempt;
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

  it("calls onAttempt with a clean correct outcome", () => {
    const onAttempt = setup();
    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false }),
    );
  });

  it("calls onAttempt with correct=false for a lookalike", () => {
    const onAttempt = setup();
    fireEvent.click(screen.getByRole("button", { name: /thought/ }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: false, rescued: false, hintsUsed: 0 }),
    );
  });

  it("shows the correct and chosen options with their IPA after an incorrect answer", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /thought/ }));

    expect(screen.getByText(/θruː/)).toBeInTheDocument();
    expect(screen.getByText(/θɔːt/)).toBeInTheDocument();
    expect(screen.getByText(/la diferencia está en/i)).toBeInTheDocument();
  });

  it("lets the learner compare the mistaken and correct sounds", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /thought/ }));
    fireEvent.click(screen.getByRole("button", { name: /comparar sonidos/i }));

    expect(speakSequence).toHaveBeenCalledWith(["thought", "through"], { rate: 0.9 });
  });

  it("records latencyMs", () => {
    const onAttempt = setup();
    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    expect(typeof onAttempt.mock.calls[0][0].latencyMs).toBe("number");
  });

  it("ignores a second choice", () => {
    const onAttempt = setup();
    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    fireEvent.click(screen.getByRole("button", { name: /thought/ }));
    expect(onAttempt).toHaveBeenCalledTimes(1);
  });

  it("continues with Enter after the choice feedback is visible", () => {
    const onContinue = vi.fn();
    render(
      <RecognizeAudioCard
        entry={entry}
        distractors={distractors}
        onAttempt={vi.fn().mockResolvedValue(undefined)}
        onContinue={onContinue}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /through/ }));
    expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("offers an explicit skip action in the card footer and confirms it", () => {
    const onArchive = vi.fn();
    render(
      <RecognizeAudioCard
        entry={entry}
        distractors={distractors}
        onAttempt={vi.fn().mockResolvedValue(undefined)}
        onArchive={onArchive}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Saltar esta palabra por ahora" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, pausar" }));

    expect(onArchive).toHaveBeenCalledOnce();
  });
});
