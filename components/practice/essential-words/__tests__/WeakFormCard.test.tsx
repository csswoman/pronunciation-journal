// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { displayEnglishText } from "@/lib/essential-words/word-display";
import { WeakFormCard } from "../WeakFormCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { speak } from "@/lib/phoneme-practice/tts";
import { selectSentence } from "@/lib/essential-words/sentence-variants";

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
    render(<WeakFormCard entry={entry} onAttempt={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText(/tuː/)).toBeInTheDocument();
    expect(screen.getByText(/tə/)).toBeInTheDocument();
  });

  it("plays the weak form in its phrase context", () => {
    render(<WeakFormCard entry={entry} onAttempt={vi.fn().mockResolvedValue(undefined)} />);
    fireEvent.click(screen.getByRole("button", { name: /escuchar/i }));
    expect(speak).toHaveBeenCalled();
  });

  it("calls onAttempt when the learner self-grades as correct", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<WeakFormCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.click(screen.getByRole("button", { name: /lo dije bien/i }));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false, typo: false }),
    );
  });

  it("calls onAttempt with an incorrect outcome when the learner struggled", () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined);
    render(<WeakFormCard entry={entry} onAttempt={onAttempt} />);
    fireEvent.click(screen.getByRole("button", { name: /me costó/i }));
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  describe("sentence rotation", () => {
    const withVariants: EssentialWord = {
      ...entry,
      example_sentences: [
        { sentence: "She had to leave early.", sentence_ipa: "/ʃi hæd tə liv ˈɜrli/" },
        { sentence: "They went to the store.", sentence_ipa: "/ðeɪ wɛnt tə ðə stɔr/" },
      ],
    };

    /** Raw weak-form phrase (TTS); display copy is capitalized separately. */
    function expectedPhraseRaw(reps: number): string {
      const { sentence } = selectSentence(withVariants, reps);
      const tokens = sentence.match(/\b[\w']+\b/g) ?? [];
      const idx = tokens.findIndex((t) => t.toLowerCase() === withVariants.word);
      return tokens.slice(idx, idx + 2).join(" ");
    }

    function expectedPhraseDisplay(reps: number): string {
      return displayEnglishText(expectedPhraseRaw(reps));
    }

    it("builds the phrase from the selected variant, not always the base sentence", () => {
      render(
        <WeakFormCard
          entry={withVariants}
          repetitions={1}
          onAttempt={vi.fn().mockResolvedValue(undefined)}
        />,
      );
      expect(screen.getByText(expectedPhraseDisplay(1))).toBeInTheDocument();
    });

    it("speaks the phrase from the selected variant", () => {
      render(
        <WeakFormCard
          entry={withVariants}
          repetitions={2}
          onAttempt={vi.fn().mockResolvedValue(undefined)}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /escuchar/i }));
      expect(speak).toHaveBeenCalledWith(expectedPhraseRaw(2), expect.anything());
    });

    it("shows a different phrase across repetitions", () => {
      const seen = new Set<string>();
      for (const reps of [0, 1, 2]) {
        const { unmount } = render(
          <WeakFormCard
            entry={withVariants}
            repetitions={reps}
            onAttempt={vi.fn().mockResolvedValue(undefined)}
          />,
        );
        seen.add(screen.getByText(expectedPhraseDisplay(reps)).textContent ?? "");
        unmount();
      }
      expect(seen.size).toBeGreaterThan(1);
    });

    it("defaults to the base sentence when no repetitions are passed", () => {
      render(
        <WeakFormCard
          entry={withVariants}
          onAttempt={vi.fn().mockResolvedValue(undefined)}
        />,
      );
      expect(screen.getByText(expectedPhraseDisplay(0))).toBeInTheDocument();
    });

    it("falls back to the base sentence when a variant lacks the target word", () => {
      const broken: EssentialWord = {
        ...entry,
        example_sentences: [
          { sentence: "A line without the target.", sentence_ipa: "/ə laɪn/" },
        ],
      };
      for (const reps of [0, 1, 2, 3]) {
        const { unmount } = render(
          <WeakFormCard
            entry={broken}
            repetitions={reps}
            onAttempt={vi.fn().mockResolvedValue(undefined)}
          />,
        );
        // "to go" comes from the base sentence; a bare "to" means the fallback fired.
        expect(screen.getByText(displayEnglishText("to go"))).toBeInTheDocument();
        unmount();
      }
    });
  });
});
