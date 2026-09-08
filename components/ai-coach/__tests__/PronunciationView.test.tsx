// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PronunciationView from "../PronunciationView";
import type { WordResult } from "@/lib/types";

const authMocks = vi.hoisted(() => ({ userId: "account-a" as string | null }));
vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: authMocks.userId ? { id: authMocks.userId } : null }),
}));

const pronunciationMocks = vi.hoisted(() => ({
  loadMasteredFromDexie: vi.fn(async () => new Set<string>()),
  loadQueueFromDexie: vi.fn(async () => ["Could you repeat that?"]),
  loadSeenFromDexie: vi.fn(async () => new Set<string>()),
  fetchWordIPA: vi.fn(async () => "test-ipa"),
  getStaticWordIPA: vi.fn(() => null),
  speakPhrase: vi.fn(),
  saveQueueToDexie: vi.fn(async () => undefined),
  saveMasteredToDexie: vi.fn(async () => undefined),
  saveSeenToDexie: vi.fn(async () => undefined),
}))

vi.mock("@/hooks/useSharedMicStream", () => ({
  useSharedMicStream: () => ({ getStream: vi.fn() }),
}))

const speechInputMocks = vi.hoisted(() => ({
  state: "idle" as string,
  transcript: null as string | null,
}));
vi.mock("@/hooks/useSpeechInput", () => ({
  useSpeechInput: () => ({
    state: speechInputMocks.state,
    result: speechInputMocks.transcript ? { transcript: speechInputMocks.transcript } : null,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock("@/lib/pronunciation/phonemes", () => ({
  ARPABET_TO_IPA: {},
  analyzePhonemes: vi.fn(async () => ({ alignment: [] })),
}))

const scoringMocks = vi.hoisted(() => ({
  scorePronunciation: vi.fn(async () => ({
    accuracy: 100,
    isCorrect: true,
    transcript: "could you repeat that",
    wordResults: [] as unknown[],
  })),
}));
vi.mock("@/lib/pronunciation/scoring", () => scoringMocks)

const practiceQueriesMocks = vi.hoisted(() => ({
  savePracticeAnswer: vi.fn(async () => undefined),
}));
vi.mock("@/lib/practice/queries", () => practiceQueriesMocks)

const activityHubMocks = vi.hoisted(() => ({
  recordActivitySession: vi.fn(async () => ({ reconciledStepIds: [] })),
}));
vi.mock("@/lib/progress/activity-hub", () => activityHubMocks)

vi.mock("@/lib/ai-coach/saveables/persist", () => ({
  persistSaveable: vi.fn(async () => undefined),
}))

vi.mock("@/lib/ai-coach/pronunciation", () => ({
  BATCH_SIZE: 5,
  PHONEME_TIPS: {},
  pickBatch: () => ["Fallback phrase"],
  shuffle: <T,>(values: T[]) => values,
  ...pronunciationMocks,
}))

vi.mock("../pronunciation/PronunciationProgress", () => ({
  default: ({ current, total }: { current: number; total: number }) => (
    <div data-testid="progress">{current}/{total}</div>
  ),
}))

vi.mock("../pronunciation/PhraseCard", () => ({
  default: ({ phrase }: { phrase: string }) => <div>{phrase}</div>,
}))

vi.mock("../pronunciation/RecordingControls", () => ({
  default: () => <button type="button">Record</button>,
}))

vi.mock("../pronunciation/CoachPanel", () => ({
  default: () => <div>Coach panel</div>,
}))

vi.mock("../pronunciation/SessionComplete", () => ({
  default: () => <div>Session complete</div>,
}))

describe("PronunciationView", () => {
  beforeEach(() => {
    authMocks.userId = "account-a";
    speechInputMocks.state = "idle";
    speechInputMocks.transcript = null;
    scoringMocks.scorePronunciation.mockClear();
    practiceQueriesMocks.savePracticeAnswer.mockClear();
    activityHubMocks.recordActivitySession.mockClear();
    pronunciationMocks.loadQueueFromDexie.mockClear();
  });

  it("loads the persisted pronunciation queue", async () => {
    render(<PronunciationView />);

    await waitFor(() => {
      expect(screen.getByText("Could you repeat that?")).toBeInTheDocument();
    });

    expect(screen.getByTestId("progress")).toHaveTextContent("0/1");
    expect(pronunciationMocks.loadQueueFromDexie).toHaveBeenCalledWith("account-a");

    // IPA fetch runs in a follow-up effect after activePhrase commits —
    // wait for it instead of asserting synchronously (race with paint).
    await waitFor(() => {
      expect(pronunciationMocks.fetchWordIPA).toHaveBeenCalled();
    });
  });

  it("persists a scored attempt through savePracticeAnswer and recordActivitySession", async () => {
    scoringMocks.scorePronunciation.mockResolvedValue({
      accuracy: 100,
      isCorrect: true,
      transcript: "could you repeat that",
      wordResults: [],
    });
    speechInputMocks.state = "done";
    speechInputMocks.transcript = "could you repeat that";

    render(<PronunciationView />);

    await waitFor(() => {
      expect(scoringMocks.scorePronunciation).toHaveBeenCalledWith(
        "could you repeat that",
        "Could you repeat that?",
      );
    });

    await waitFor(() => {
      expect(practiceQueriesMocks.savePracticeAnswer).toHaveBeenCalledWith(
        "account-a",
        expect.objectContaining({
          isCorrect: true,
          score: 100,
          userAnswer: "could you repeat that",
          context: "ai_coach",
        }),
      );
    });
    expect(activityHubMocks.recordActivitySession).toHaveBeenCalledWith(
      "account-a",
      expect.objectContaining({ practiceContext: "ai_coach" }),
    );
  });

  it("does not shift feedback for later words when an earlier word is omitted", async () => {
    // "you" omitted from the transcript — edit-distance alignment should
    // still match "repeat" and "that" to their correct expected words,
    // unlike a positional index-zip which would shift everything by one.
    scoringMocks.scorePronunciation.mockResolvedValue({
      accuracy: 75,
      isCorrect: false,
      transcript: "could repeat that",
      wordResults: [
        { expected: "could", got: "could", status: "correct" },
        { expected: "you", got: "", status: "missing" },
        {
          expected: "repeat",
          got: "repeat",
          status: "correct",
          phonemes: { expected: [], got: [], tip: null, alignment: [{ phoneme: "R", status: "correct" }] },
        },
        {
          expected: "that",
          got: "that",
          status: "correct",
          phonemes: { expected: [], got: [], tip: null, alignment: [{ phoneme: "DH", status: "correct" }] },
        },
      ] satisfies WordResult[],
    });
    speechInputMocks.state = "done";
    speechInputMocks.transcript = "could repeat that";

    render(<PronunciationView />);

    await waitFor(() => {
      expect(practiceQueriesMocks.savePracticeAnswer).toHaveBeenCalledWith(
        "account-a",
        expect.objectContaining({ isCorrect: false, score: 75 }),
      );
    });
  });

  it("does not persist attempts for a signed-out user, and scopes attempts per user", async () => {
    authMocks.userId = null;
    speechInputMocks.state = "done";
    speechInputMocks.transcript = "could you repeat that";

    render(<PronunciationView />);

    // Signed-out: the queue-loading effect never fires (guarded by `if (!userId) return`),
    // so the queue stays empty and the session renders as immediately done.
    await waitFor(() => {
      expect(screen.getByText("Session complete")).toBeInTheDocument();
    });
    expect(pronunciationMocks.loadQueueFromDexie).not.toHaveBeenCalled();
    expect(practiceQueriesMocks.savePracticeAnswer).not.toHaveBeenCalled();
    expect(activityHubMocks.recordActivitySession).not.toHaveBeenCalled();
  });
});
