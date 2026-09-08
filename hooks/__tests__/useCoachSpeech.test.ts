// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachSpeech } from "../useCoachSpeech";

describe("useCoachSpeech", () => {
  let speakSpy: ReturnType<typeof vi.fn>;
  let cancelSpy: ReturnType<typeof vi.fn>;
  let originalSynthesis: typeof window.speechSynthesis;
  let originalUtterance: typeof window.SpeechSynthesisUtterance;

  beforeEach(() => {
    speakSpy = vi.fn((utterance: SpeechSynthesisUtterance) => {
      // Simulate onstart
      utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
    });
    cancelSpy = vi.fn();

    originalSynthesis = window.speechSynthesis;
    originalUtterance = window.SpeechSynthesisUtterance;

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      writable: true,
      value: {
        speak: speakSpy,
        cancel: cancelSpy,
      },
    });

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      onstart: ((e: unknown) => void) | null = null;
      onend: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      writable: true,
      value: MockUtterance,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      writable: true,
      value: originalSynthesis,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      writable: true,
      value: originalUtterance,
    });
  });

  it("reports isAvailable = true and isSpeaking = false initially", () => {
    const { result } = renderHook(() => useCoachSpeech({ text: "Hello there!" }));
    expect(result.current.isAvailable).toBe(true);
    expect(result.current.isSpeaking).toBe(false);
  });

  it("starts speaking on toggle and sets isSpeaking = true", () => {
    const { result } = renderHook(() => useCoachSpeech({ text: "Practice English" }));

    act(() => {
      result.current.toggle();
    });

    expect(speakSpy).toHaveBeenCalledOnce();
    expect(result.current.isSpeaking).toBe(true);
  });

  it("stops speaking when toggle is clicked while speaking", () => {
    const { result } = renderHook(() => useCoachSpeech({ text: "Practice English" }));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(cancelSpy).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it("resets isSpeaking when utterance triggers onend", () => {
    let capturedUtterance: SpeechSynthesisUtterance | null = null;
    speakSpy.mockImplementation((utterance: SpeechSynthesisUtterance) => {
      capturedUtterance = utterance;
    });

    const { result } = renderHook(() => useCoachSpeech({ text: "Practice English" }));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      capturedUtterance?.onend?.(new Event("end") as SpeechSynthesisEvent);
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it("resets isSpeaking when utterance triggers onerror", () => {
    let capturedUtterance: SpeechSynthesisUtterance | null = null;
    speakSpy.mockImplementation((utterance: SpeechSynthesisUtterance) => {
      capturedUtterance = utterance;
    });

    const { result } = renderHook(() => useCoachSpeech({ text: "Practice English" }));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      capturedUtterance?.onerror?.(new Event("error") as SpeechSynthesisErrorEvent);
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it("calls cancelSpeech on unmount", () => {
    const { result, unmount } = renderHook(() => useCoachSpeech({ text: "Hello" }));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isSpeaking).toBe(true);

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it("does nothing if text is empty or whitespace", () => {
    const { result } = renderHook(() => useCoachSpeech({ text: "   " }));

    act(() => {
      result.current.toggle();
    });
    expect(speakSpy).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });
});
