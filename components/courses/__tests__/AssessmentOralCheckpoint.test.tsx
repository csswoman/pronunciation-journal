// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  recorder: {
    state: "idle" as "idle" | "recording" | "done" | "error",
    result: null as { blob: Blob; url: string; durationMs: number } | null,
    isSupported: true,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock("@/hooks/useVoiceRecorder", () => ({ useVoiceRecorder: () => mocks.recorder }));

import { AssessmentOralCheckpoint } from "../AssessmentOralCheckpoint";

const attemptId = "df7539d3-0346-4432-8e93-884eaf79da44";
const challenge = {
  id: "c6d5ab28-911a-4dbd-aa36-28c2e6cb60f6",
  level: "a1" as const,
  prompt: "Tell a new friend where you live.",
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.recorder.state = "idle";
  mocks.recorder.result = null;
  mocks.recorder.isSupported = true;
  mocks.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ passed: false, retryable: true, message: "Intenta de nuevo." }),
  });
});

describe("AssessmentOralCheckpoint", () => {
  it("starts capture, previews audio, and sends only the audio plus attempt challenge IDs", async () => {
    const onComplete = vi.fn();
    const onDefer = vi.fn();
    const props = {
      level: "a1" as const,
      attemptId,
      initialChallenge: challenge,
      onComplete,
      onDefer,
    };
    const view = render(<AssessmentOralCheckpoint {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Grabar respuesta" }));
    expect(mocks.recorder.start).toHaveBeenCalledOnce();
    mocks.recorder.state = "done";
    mocks.recorder.result = {
      blob: new Blob(["spoken response"], { type: "audio/webm" }),
      url: "blob:oral-response",
      durationMs: 2_000,
    };
    view.rerender(<AssessmentOralCheckpoint {...props} />);
    expect(screen.getByLabelText("Escuchar la respuesta grabada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enviar audio" }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());
    const [, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    const formData = init.body as FormData;

    expect(formData.get("attemptId")).toBe(attemptId);
    expect(formData.get("challengeId")).toBe(challenge.id);
    expect(formData.get("audio")).toBeInstanceOf(File);
    expect(formData.get("transcript")).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Intenta de nuevo.");
  });

  it("explains unsupported recording access and keeps the defer action available", async () => {
    mocks.recorder.isSupported = false;
    const onDefer = vi.fn().mockResolvedValue(undefined);
    render(
      <AssessmentOralCheckpoint
        level="a1"
        attemptId={attemptId}
        initialChallenge={challenge}
        onComplete={vi.fn()}
        onDefer={onDefer}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("no ofrece grabación compatible");
    fireEvent.click(screen.getByRole("button", { name: "Dejar para después" }));
    await waitFor(() => expect(onDefer).toHaveBeenCalledWith(attemptId));
    expect(mocks.recorder.start).not.toHaveBeenCalled();
  });
});
