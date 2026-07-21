// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CustomPromptPanel from "../CustomPromptPanel";

vi.mock("@/hooks/useSharedMicStream", () => ({
  useSharedMicStream: () => ({ getStream: vi.fn() }),
}));

const speechInputMocks = vi.hoisted(() => ({
  state: "idle" as string,
  result: null as { transcript: string } | null,
  error: null as string | null,
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
  __onResult: undefined as ((r: { transcript: string }) => void) | undefined,
  __onError: undefined as ((e: Error) => void) | undefined,
}));

vi.mock("@/hooks/useSpeechInput", () => ({
  useSpeechInput: (opts: { onResult?: (r: { transcript: string }) => void; onError?: (e: Error) => void }) => {
    speechInputMocks.__onResult = opts.onResult;
    speechInputMocks.__onError = opts.onError;
    return {
      state: speechInputMocks.state,
      result: speechInputMocks.result,
      error: speechInputMocks.error,
      isSupported: true,
      start: speechInputMocks.start,
      stop: speechInputMocks.stop,
      abort: vi.fn(),
      reset: speechInputMocks.reset,
    };
  },
}));

describe("CustomPromptPanel", () => {
  beforeEach(() => {
    speechInputMocks.state = "idle";
    speechInputMocks.result = null;
    speechInputMocks.error = null;
    speechInputMocks.start.mockReset();
    speechInputMocks.stop.mockReset();
    speechInputMocks.reset.mockReset();
  });

  it("sends a typed message without a voice tag", () => {
    const onSubmit = vi.fn();
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    const textarea = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(textarea, { target: { value: "hello there" } });
    fireEvent.click(screen.getByLabelText("Send"));

    expect(onSubmit).toHaveBeenCalledWith("hello there");
  });

  it("clicking the mic button starts recording", () => {
    const onSubmit = vi.fn();
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    fireEvent.click(screen.getByLabelText("Voice input"));

    expect(speechInputMocks.start).toHaveBeenCalled();
  });

  it("sends the transcript with a scored voice tag on successful recognition", () => {
    const onSubmit = vi.fn();
    speechInputMocks.state = "listening";
    const { rerender } = render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    // Simulate onResult firing (as useSpeechInput would after stop())
    speechInputMocks.__onResult?.({ transcript: "how are you" });
    speechInputMocks.state = "done";
    speechInputMocks.result = { transcript: "how are you" };
    rerender(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    expect(onSubmit).toHaveBeenCalledWith("how are you", { voice: { transcript: true, scored: true } });
  });

  it("shows a retry affordance and does not call onSubmit on permission denial", () => {
    const onSubmit = vi.fn();
    speechInputMocks.state = "error";
    speechInputMocks.error = "not-allowed";
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("retry button resets the speech input state", () => {
    const onSubmit = vi.fn();
    speechInputMocks.state = "error";
    speechInputMocks.error = "not-allowed";
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(speechInputMocks.reset).toHaveBeenCalled();
  });

  it("does not send anything when recognition produces an empty transcript", () => {
    const onSubmit = vi.fn();
    render(<CustomPromptPanel onSubmit={onSubmit} isDisabled={false} variant="chat" />);

    speechInputMocks.__onResult?.({ transcript: "   " });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
