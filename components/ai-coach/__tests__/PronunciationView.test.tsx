// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PronunciationView from "../PronunciationView";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "account-a" } }),
}));

const pronunciationMocks = vi.hoisted(() => ({
  loadMasteredFromDexie: vi.fn(async () => new Set<string>()),
  loadQueueFromDexie: vi.fn(async () => ["Could you repeat that?"]),
  loadSeenFromDexie: vi.fn(async () => new Set<string>()),
  fetchWordIPA: vi.fn(async () => "test-ipa"),
  speakPhrase: vi.fn(),
  saveQueueToDexie: vi.fn(async () => undefined),
  saveMasteredToDexie: vi.fn(async () => undefined),
  saveSeenToDexie: vi.fn(async () => undefined),
}))

vi.mock("@/hooks/useSharedMicStream", () => ({
  useSharedMicStream: () => ({ getStream: vi.fn() }),
}))

vi.mock("@/hooks/useSpeechInput", () => ({
  useSpeechInput: () => ({
    state: "idle",
    result: null,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock("@/lib/pronunciation/phonemes", () => ({
  ARPABET_TO_IPA: {},
  analyzePhonemes: vi.fn(async () => ({ alignment: [] })),
}))

vi.mock("@/lib/db/ai", () => ({
  saveAIWord: vi.fn(async () => undefined),
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
});
