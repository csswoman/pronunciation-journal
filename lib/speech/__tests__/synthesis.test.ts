// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelSpeech, speakText } from "../synthesis";

class FakeSpeechSynthesisUtterance {
  lang = "";
  rate = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public text: string) {}
}

describe("speech synthesis helpers", () => {
  const cancel = vi.fn();
  const speak = vi.fn();

  beforeEach(() => {
    cancel.mockClear();
    speak.mockClear();
    vi.stubGlobal("SpeechSynthesisUtterance", FakeSpeechSynthesisUtterance);
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel, speak },
    });
  });

  it("cancels current speech before speaking text", () => {
    speakText("hello", { rate: 0.7 });

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0]).toMatchObject({ text: "hello", lang: "en-US", rate: 0.7 });
  });

  it("cancels speech without speaking", () => {
    cancelSpeech();

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).not.toHaveBeenCalled();
  });
});
