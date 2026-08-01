// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAccessToken = vi.fn();
const generateMatchPairsFromWordBank = vi.fn();
const generateSentenceContextExercises = vi.fn();
const fromGenericExercise = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAccessToken: () => getAccessToken(),
}));

vi.mock("@/lib/exercises/generators/match-pairs", () => ({
  generateMatchPairsFromWordBank: (...args: unknown[]) => generateMatchPairsFromWordBank(...args),
}));

vi.mock("@/lib/lexicon/exercises", () => ({
  generateSentenceContextExercises: (...args: unknown[]) => generateSentenceContextExercises(...args),
}));

vi.mock("@/lib/practice/adapters", () => ({
  fromGenericExercise: (...args: unknown[]) => fromGenericExercise(...args),
}));

import { useLexiconPracticeSession } from "../useLexiconPracticeSession";

function makeWordEntry(id: string) {
  return {
    id,
    word: id,
    definition: `${id} definition`,
    example: `${id} example`,
    difficulty: 1,
    pos: "noun",
  };
}

function makeWordBankEntry(source_ref: string) {
  return {
    id: `bank:${source_ref}`,
    user_id: "user-1",
    text: source_ref,
    meaning: `${source_ref} meaning`,
    example: `${source_ref} example`,
    difficulty: 1,
    source: "lexicon",
    source_ref,
    status: "ready",
    srs_status: "new",
    audio_url: null,
    ipa: null,
    context: null,
    created_at: "",
    updated_at: "",
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    review_count: 0,
    last_reviewed_at: null,
    next_review_at: null,
    error_reason: null,
    has_audio: null,
    audio_fetch_attempts: 0,
    image_prompt: null,
    synonyms: null,
    translation: null,
  };
}

describe("useLexiconPracticeSession", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    getAccessToken.mockReset();
    generateMatchPairsFromWordBank.mockReset();
    generateSentenceContextExercises.mockReset();
    fromGenericExercise.mockReset();
  });

  it("restaura una sesión guardada sin refetch", async () => {
    const saved = {
      categoryId: "essential-words",
      lessonName: "Core 1000",
      allEntries: [makeWordBankEntry("alpha")],
      sessionWordEntries: [makeWordEntry("alpha")],
      posMapEntries: [["alpha", "noun"]],
      flowPhase: "summary",
      ratings: [],
      practiceExercises: [],
      sessionKey: 2,
    };
    sessionStorage.setItem("lexicon-practice:essential-words", JSON.stringify(saved));

    const { result } = renderHook(() => useLexiconPracticeSession("essential-words", "user-1"));

    await waitFor(() => {
      expect(result.current.loadState).toBe("ready");
    });

    expect(result.current.lessonName).toBe("Core 1000");
    expect(result.current.flowPhase).toBe("summary");
    expect(result.current.sessionKey).toBe(2);
  });

  it("convierte la revisión en práctica y avanza la fase", async () => {
    const words = [makeWordEntry("alpha"), makeWordEntry("beta"), makeWordEntry("gamma"), makeWordEntry("delta")];
    const rows = words.map((word) => makeWordBankEntry(word.id));

    getAccessToken.mockResolvedValue("token");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ words, wordBankRows: rows }),
    }) as typeof fetch;

    generateMatchPairsFromWordBank.mockReturnValue([{ id: "m1" }, { id: "m2" }]);
    generateSentenceContextExercises.mockReturnValue([{ id: "s1" }]);
    fromGenericExercise.mockImplementation((ex) => ({ id: ex.id, source: "practice" }));

    const { result } = renderHook(() => useLexiconPracticeSession("essential-words", "user-1"));

    await waitFor(() => {
      expect(result.current.loadState).toBe("ready");
    });

    act(() => {
      result.current.handleReviewComplete([
        { rating: "forgot", entry: rows[0] },
        { rating: "normal", entry: rows[1] },
      ] as never[]);
    });

    await waitFor(() => {
      expect(result.current.flowPhase).toBe("summary");
    });

    expect(generateMatchPairsFromWordBank).toHaveBeenCalled();
    expect(generateSentenceContextExercises).toHaveBeenCalled();
    expect(result.current.practiceExercises).toHaveLength(3);
    expect(result.current.sessionKey).toBe(1);
  });
});
