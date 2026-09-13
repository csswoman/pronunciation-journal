// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  BROWSER_BLOCKS_STT_ES,
  MIC_TIP_DISMISSED_KEY,
  MIC_UNAVAILABLE_BODY_ES,
  SCORING_UNAVAILABLE_ES,
  SCORING_UNAVAILABLE_SHADOW_ES,
  STT_NETWORK_FAILURE_ES,
  dismissMicTip,
  readMicTipDismissed,
} from "@/lib/speech/browser-support-message";

describe("mic tip dismiss", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("starts undismissed and persists dismissal", () => {
    expect(readMicTipDismissed()).toBe(false);
    dismissMicTip();
    expect(readMicTipDismissed()).toBe(true);
    expect(window.localStorage.getItem(MIC_TIP_DISMISSED_KEY)).toBe("1");
  });
});

describe("degradation copy honesty", () => {
  // Scoring runs through Gemini in every browser with a microphone, so naming
  // a browser as the cause — or telling the learner to install one — is false.
  const learnerFacingCopy = [
    BROWSER_BLOCKS_STT_ES,
    MIC_UNAVAILABLE_BODY_ES,
    SCORING_UNAVAILABLE_ES,
    SCORING_UNAVAILABLE_SHADOW_ES,
    STT_NETWORK_FAILURE_ES,
  ];

  it("never blames or recommends a specific browser", () => {
    for (const copy of learnerFacingCopy) {
      expect(copy).not.toMatch(/Chrome|Firefox|Safari|Brave|Opera|Edge|Arc/i);
    }
  });
});
