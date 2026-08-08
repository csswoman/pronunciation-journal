// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  CHROME_MIC_TIP_DISMISSED_KEY,
  dismissChromeMicTip,
  readChromeMicTipDismissed,
} from "@/lib/speech/browser-support-message";

describe("chrome mic tip dismiss", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("starts undismissed and persists dismissal", () => {
    expect(readChromeMicTipDismissed()).toBe(false);
    dismissChromeMicTip();
    expect(readChromeMicTipDismissed()).toBe(true);
    expect(window.localStorage.getItem(CHROME_MIC_TIP_DISMISSED_KEY)).toBe("1");
  });
});
