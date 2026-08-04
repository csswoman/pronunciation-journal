// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  describe("sentence rotation", () => {
    const withVariants: EssentialWord = {
      ...entry,
      example_sentences: [
        { sentence: "She had to leave early.", sentence_ipa: "/ʃi hæd tə liv ˈɜrli/" },
        { sentence: "They went to the store.", sentence_ipa: "/ðeɪ wɛnt tə ðə stɔr/" },
      ],
    };

    /** The two-token weak-form phrase the card should build for a given rotation. */
    function expectedPhrase(reps: number): string {
      const { sentence } = selectSentence(withVariants, reps);
      const tokens = sentence.match(/\b[\w']+\b/g) ?? [];
      const idx = tokens.findIndex((t) => t.toLowerCase() === withVariants.word);
      return tokens.slice(idx, idx + 2).join(" ");
    }

    it("builds the phrase from the selected variant, not always the base sentence", () => {
      render(
        <WeakFormCard
          entry={withVariants}
          repetitions={1}
          onGraded={vi.fn().mockResolvedValue(undefined)}
        />,
      );
      expect(screen.getByText(expectedPhrase(1))).toBeInTheDocument();
    });

    it("speaks the phrase from the selected variant", () => {
      render(
        <WeakFormCard
          entry={withVariants}
          repetitions={2}
          onGraded={vi.fn().mockResolvedValue(undefined)}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /escuchar/i }));
      expect(speak).toHaveBeenCalledWith(expectedPhrase(2), expect.anything());
    });

    it("shows a different phrase across repetitions", () => {
      const seen = new Set<string>();
      for (const reps of [0, 1, 2]) {
        const { unmount } = render(
          <WeakFormCard
            entry={withVariants}
            repetitions={reps}
            onGraded={vi.fn().mockResolvedValue(undefined)}
          />,
        );
        seen.add(screen.getByText(expectedPhrase(reps)).textContent ?? "");
        unmount();
      }
      expect(seen.size).toBeGreaterThan(1);
    });

    it("defaults to the base sentence when no repetitions are passed", () => {
      render(
        <WeakFormCard
          entry={withVariants}
          onGraded={vi.fn().mockResolvedValue(undefined)}
        />,
      );
      expect(screen.getByText(expectedPhrase(0))).toBeInTheDocument();
    });

    it("falls back to the base sentence when a variant lacks the target word", () => {
      // weakFormPhrase returns the bare word when it cannot locate it, which
      // would strip the card of all phrase context. The card must not pick such
      // a variant.
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
            onGraded={vi.fn().mockResolvedValue(undefined)}
          />,
        );
        // "to go" comes from the base sentence; a bare "to" means the fallback fired.
        expect(screen.getByText("to go")).toBeInTheDocument();
        unmount();
      }
    });
  });
});
