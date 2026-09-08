// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSpeakingOwnerId,
  isPlaybackAvailable,
  releasePlayback,
  requestPlayback,
  resetPlaybackRegistry,
  subscribeToPlayback,
} from "../playback-registry";

describe("playback-registry", () => {
  let speakSpy: ReturnType<typeof vi.fn>;
  let cancelSpy: ReturnType<typeof vi.fn>;
  let utterances: Array<{ onend?: () => void; onerror?: () => void }>;
  let originalSynthesis: typeof window.speechSynthesis;
  let originalUtterance: typeof window.SpeechSynthesisUtterance;

  beforeEach(() => {
    utterances = [];
    speakSpy = vi.fn();
    cancelSpy = vi.fn();
    originalSynthesis = window.speechSynthesis;
    originalUtterance = window.SpeechSynthesisUtterance;

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      writable: true,
      value: { speak: speakSpy, cancel: cancelSpy },
    });

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
        utterances.push(this as never);
      }
    }

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      writable: true,
      value: MockUtterance,
    });
  });

  afterEach(() => {
    resetPlaybackRegistry();
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

  it("reports availability and starts with no owner", () => {
    expect(isPlaybackAvailable()).toBe(true);
    expect(getSpeakingOwnerId()).toBeNull();
  });

  it("tracks the requesting owner while speaking", () => {
    requestPlayback("bubble-a", "Hello");
    expect(speakSpy).toHaveBeenCalledOnce();
    expect(getSpeakingOwnerId()).toBe("bubble-a");
  });

  it("ignores blank text without claiming ownership", () => {
    requestPlayback("bubble-a", "   ");
    expect(speakSpy).not.toHaveBeenCalled();
    expect(getSpeakingOwnerId()).toBeNull();
  });

  // The bug this registry exists for: a bubble displaced by another one used
  // to keep its own isSpeaking=true and stay stuck showing "Detener".
  it("transfers ownership when a second owner claims playback", () => {
    const seen: Array<string | null> = [];
    subscribeToPlayback((owner) => seen.push(owner));

    requestPlayback("bubble-a", "First message");
    expect(getSpeakingOwnerId()).toBe("bubble-a");

    requestPlayback("bubble-b", "Second message");
    expect(getSpeakingOwnerId()).toBe("bubble-b");
    expect(seen).toEqual(["bubble-a", "bubble-b"]);
  });

  it("ignores a displaced owner's late onend so the new owner keeps playing", () => {
    requestPlayback("bubble-a", "First message");
    requestPlayback("bubble-b", "Second message");

    // The cancelled first utterance fires onend after B took over.
    utterances[0].onend?.();

    expect(getSpeakingOwnerId()).toBe("bubble-b");
  });

  it("clears ownership when the active utterance ends", () => {
    requestPlayback("bubble-a", "Hello");
    utterances[0].onend?.();
    expect(getSpeakingOwnerId()).toBeNull();
  });

  it("clears ownership on synthesis error", () => {
    requestPlayback("bubble-a", "Hello");
    utterances[0].onerror?.();
    expect(getSpeakingOwnerId()).toBeNull();
  });

  it("releasePlayback stops playback only for the current owner", () => {
    requestPlayback("bubble-a", "Hello");
    // `speakText` cancels before speaking, so count from here rather than zero.
    const cancelsAfterStart = cancelSpy.mock.calls.length;

    releasePlayback("bubble-b");
    expect(cancelSpy).toHaveBeenCalledTimes(cancelsAfterStart);
    expect(getSpeakingOwnerId()).toBe("bubble-a");

    releasePlayback("bubble-a");
    expect(cancelSpy).toHaveBeenCalledTimes(cancelsAfterStart + 1);
    expect(getSpeakingOwnerId()).toBeNull();
  });

  it("notifies subscribers until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToPlayback(listener);

    requestPlayback("bubble-a", "Hello");
    expect(listener).toHaveBeenCalledWith("bubble-a");

    unsubscribe();
    requestPlayback("bubble-b", "Another");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
