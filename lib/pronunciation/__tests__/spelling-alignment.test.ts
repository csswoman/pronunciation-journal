import { describe, it, expect } from "vitest";
import { alignWordToPhoneme } from "../spelling-alignment";

describe("alignWordToPhoneme", () => {
  it("aligns 'ee' in 'sheep' for /iː/", () => {
    const segments = alignWordToPhoneme("sheep", "/iː/");
    expect(segments).toEqual([
      { text: "sh", isTarget: false },
      { text: "ee", isTarget: true },
      { text: "p", isTarget: false },
    ]);
  });

  it("aligns 'i' in 'ship' for /ɪ/", () => {
    const segments = alignWordToPhoneme("ship", "/ɪ/");
    expect(segments).toEqual([
      { text: "sh", isTarget: false },
      { text: "i", isTarget: true },
      { text: "p", isTarget: false },
    ]);
  });

  it("aligns 'th' in 'think' for /θ/", () => {
    const segments = alignWordToPhoneme("think", "/θ/");
    expect(segments).toEqual([
      { text: "th", isTarget: true },
      { text: "ink", isTarget: false },
    ]);
  });

  it("aligns 'tch' in 'watch' for /tʃ/", () => {
    const segments = alignWordToPhoneme("watch", "/tʃ/");
    expect(segments).toEqual([
      { text: "wa", isTarget: false },
      { text: "tch", isTarget: true },
    ]);
  });
});
