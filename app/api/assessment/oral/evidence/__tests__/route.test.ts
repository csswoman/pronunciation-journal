import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authUserId: "u1",
  rateLimit: vi.fn(),
  checkDailyAiUserLimit: vi.fn(),
  getAssessmentProfileLevel: vi.fn(),
  persistAssessmentOutcome: vi.fn(),
  getAssessmentOralAttempt: vi.fn(),
  claimAssessmentOralChallenge: vi.fn(),
  resetAssessmentOralChallenge: vi.fn(),
  acceptAssessmentOralEvidence: vi.fn(),
  markAssessmentOralAttemptCompleted: vi.fn(),
  parseAssessmentOralAnswers: vi.fn(),
  transcribeAssessmentOralAudio: vi.fn(),
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: mocks.authUserId }, error: null }),
  rateLimit: mocks.rateLimit,
  checkDailyAiUserLimit: mocks.checkDailyAiUserLimit,
  SECURE_HEADERS: { "Cache-Control": "no-store" },
  publicErrorResponse: (status: number, message: string) => Response.json({ error: message }, { status }),
}));

vi.mock("@/lib/courses/assessment-queries", () => ({
  getAssessmentProfileLevel: mocks.getAssessmentProfileLevel,
  persistAssessmentOutcome: mocks.persistAssessmentOutcome,
}));

vi.mock("@/lib/courses/assessment-oral-queries", () => ({
  acceptAssessmentOralEvidence: mocks.acceptAssessmentOralEvidence,
  claimAssessmentOralChallenge: mocks.claimAssessmentOralChallenge,
  getAssessmentOralAttempt: mocks.getAssessmentOralAttempt,
  markAssessmentOralAttemptCompleted: mocks.markAssessmentOralAttemptCompleted,
  parseAssessmentOralAnswers: mocks.parseAssessmentOralAnswers,
  resetAssessmentOralChallenge: mocks.resetAssessmentOralChallenge,
}));

vi.mock("@/lib/courses/assessment-oral-transcription", () => ({
  transcribeAssessmentOralAudio: mocks.transcribeAssessmentOralAudio,
}));

vi.mock("@/lib/api/logging", () => ({ logServerError: vi.fn() }));

import { POST } from "../route";
import { buildServerAssessment } from "@/lib/courses/server-assessment";

const attemptId = "df7539d3-0346-4432-8e93-884eaf79da44";
const challengeId = "c6d5ab28-911a-4dbd-aa36-28c2e6cb60f6";

function passingAnswers(): Record<string, number> {
  const { questions } = buildServerAssessment("checkpoint", "a1");
  return Object.fromEntries(questions.map((question) => [question.id, question.answer]));
}

interface TestAttempt {
  id: string;
  user_id: string;
  level: string;
  answers: Record<string, number>;
  self_ratings: Record<string, never>;
  status: string;
  challenge_id: string | null;
  item_id: string | null;
  used_item_ids: string[];
  challenge_expires_at: string | null;
  expires_at: string;
  oral_audio_sha256: string | null;
  rubric_version: string | null;
  created_at: string;
  completed_at: string | null;
}

function makeAttempt(overrides: Partial<TestAttempt> = {}): TestAttempt {
  return {
    id: attemptId,
    user_id: "u1",
    level: "a1",
    answers: passingAnswers(),
    self_ratings: {},
    status: "oral_pending",
    challenge_id: challengeId,
    item_id: "a1-home-lima-park",
    used_item_ids: ["a1-home-lima-park"],
    challenge_expires_at: new Date(Date.now() + 60_000).toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    oral_audio_sha256: null,
    rubric_version: null,
    created_at: new Date().toISOString(),
    completed_at: null,
    ...overrides,
  };
}

let savedAttempt: TestAttempt;

function requestWithAudio(options: {
  userId?: string;
  attempt?: string;
  challenge?: string;
  audio?: Blob;
  clientTranscript?: string;
} = {}): Request {
  const form = new FormData();
  form.append("attemptId", options.attempt ?? attemptId);
  form.append("challengeId", options.challenge ?? challengeId);
  form.append("audio", options.audio ?? new Blob(["sample-audio"], { type: "audio/webm" }), "response.webm");
  if (options.clientTranscript) form.append("transcript", options.clientTranscript);
  if (options.userId) mocks.authUserId = options.userId;
  return new Request("http://x/api/assessment/oral/evidence", { method: "POST", body: form });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authUserId = "u1";
  savedAttempt = makeAttempt();
  mocks.rateLimit.mockResolvedValue({ limited: false, error: null });
  mocks.checkDailyAiUserLimit.mockResolvedValue({ limited: false, error: null });
  mocks.getAssessmentProfileLevel.mockResolvedValue("A1");
  mocks.persistAssessmentOutcome.mockResolvedValue(undefined);
  mocks.getAssessmentOralAttempt.mockImplementation(async (userId: string, id: string) =>
    userId === "u1" && id === attemptId ? { ...savedAttempt } : null);
  mocks.claimAssessmentOralChallenge.mockImplementation(async (input: {
    userId: string;
    attemptId: string;
    challengeId: string;
    now: string;
  }) => {
    if (input.userId !== "u1" || input.attemptId !== attemptId
      || input.challengeId !== savedAttempt.challenge_id || savedAttempt.status !== "oral_pending"
      || !savedAttempt.challenge_expires_at || savedAttempt.challenge_expires_at <= input.now) return null;
    savedAttempt.status = "oral_processing";
    return { ...savedAttempt };
  });
  mocks.resetAssessmentOralChallenge.mockImplementation(async () => {
    savedAttempt.status = "oral_pending";
    savedAttempt.challenge_id = null;
    savedAttempt.item_id = null;
    savedAttempt.challenge_expires_at = null;
  });
  mocks.acceptAssessmentOralEvidence.mockImplementation(async (input: {
    audioSha256: string;
    rubricVersion: string;
  }) => {
    savedAttempt.status = "oral_passed";
    savedAttempt.oral_audio_sha256 = input.audioSha256;
    savedAttempt.rubric_version = input.rubricVersion;
    return { attempt: { ...savedAttempt } };
  });
  mocks.markAssessmentOralAttemptCompleted.mockImplementation(async () => {
    savedAttempt.status = "completed";
  });
  mocks.parseAssessmentOralAnswers.mockImplementation((answers: unknown) => answers);
  mocks.transcribeAssessmentOralAudio.mockResolvedValue("Ana lives in Lima. There is a park near her home.");
});

describe("oral assessment evidence route", () => {
  it("accepts server-transcribed evidence and makes a same-audio replay idempotent", async () => {
    const firstResponse = await POST(requestWithAudio({ clientTranscript: "I passed the oral check" }) as never);
    const firstBody = await firstResponse.json();
    const replayResponse = await POST(requestWithAudio({ clientTranscript: "I passed the oral check" }) as never);
    const replayBody = await replayResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstBody).toMatchObject({ passed: true, result: { oralEvidence: { status: "passed" } } });
    expect(mocks.checkDailyAiUserLimit).toHaveBeenCalledWith(
      { id: "u1" },
      "/api/assessment/oral/evidence",
    );
    expect(replayResponse.status).toBe(200);
    expect(replayBody.passed).toBe(true);
    expect(mocks.transcribeAssessmentOralAudio).toHaveBeenCalledOnce();
    expect(mocks.persistAssessmentOutcome).toHaveBeenCalledOnce();
    expect(mocks.transcribeAssessmentOralAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      "audio/webm",
    );
  });

  it("rejects empty, expired, and foreign-user evidence before transcription", async () => {
    const empty = await POST(requestWithAudio({ audio: new Blob([], { type: "audio/webm" }) }) as never);
    savedAttempt = makeAttempt({ expires_at: new Date(Date.now() - 1_000).toISOString() });
    const expired = await POST(requestWithAudio() as never);
    savedAttempt = makeAttempt({ challenge_expires_at: new Date(Date.now() - 1_000).toISOString() });
    const expiredChallenge = await POST(requestWithAudio() as never);
    savedAttempt = makeAttempt();
    const foreign = await POST(requestWithAudio({ userId: "u2" }) as never);

    expect(empty.status).toBe(400);
    expect(expired.status).toBe(410);
    expect(expiredChallenge.status).toBe(409);
    expect(foreign.status).toBe(404);
    expect(mocks.transcribeAssessmentOralAudio).not.toHaveBeenCalled();
  });

  it("keeps the attempt pending when transcription fails technically", async () => {
    mocks.transcribeAssessmentOralAudio.mockRejectedValueOnce(new Error("transcription unavailable"));

    const response = await POST(requestWithAudio() as never);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("checkpoint sigue pendiente");
    expect(savedAttempt.status).toBe("oral_pending");
    expect(mocks.resetAssessmentOralChallenge).toHaveBeenCalledOnce();
    expect(mocks.persistAssessmentOutcome).not.toHaveBeenCalled();
  });

  it("keeps mismatched speech retryable without turning it into a failed checkpoint", async () => {
    mocks.transcribeAssessmentOralAudio.mockResolvedValueOnce("Ana lives in Lima.");

    const response = await POST(requestWithAudio() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ passed: false, retryable: true });
    expect(savedAttempt.status).toBe("oral_pending");
    expect(mocks.resetAssessmentOralChallenge).toHaveBeenCalledOnce();
    expect(mocks.persistAssessmentOutcome).not.toHaveBeenCalled();
  });

  it("allows only one of two simultaneous submissions to claim a challenge", async () => {
    let releaseTranscript: ((transcript: string) => void) | undefined;
    mocks.transcribeAssessmentOralAudio.mockImplementationOnce(() => new Promise((resolve) => {
      releaseTranscript = resolve;
    }));
    const firstRequest = POST(requestWithAudio() as never);
    await vi.waitFor(() => expect(mocks.transcribeAssessmentOralAudio).toHaveBeenCalledOnce());
    const secondResponse = await POST(requestWithAudio() as never);
    releaseTranscript?.("Ana lives in Lima. There is a park near her home.");
    const firstResponse = await firstRequest;

    expect(secondResponse.status).toBe(409);
    expect(firstResponse.status).toBe(200);
    expect(mocks.transcribeAssessmentOralAudio).toHaveBeenCalledOnce();
  });
});
