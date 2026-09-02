import { describe, it, expect } from "vitest";
import { CONNECTED_SPEECH_DATA } from "../connected-speech-data";

describe("CONNECTED_SPEECH_DATA integrity", () => {
  it("has unique IDs for all phrases", () => {
    const ids = CONNECTED_SPEECH_DATA.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("includes at least 8 weak-forms phrases", () => {
    const weakForms = CONNECTED_SPEECH_DATA.filter((p) => p.category === "weak-forms");
    expect(weakForms.length).toBeGreaterThanOrEqual(8);
  });

  it("validates all required properties for every phrase", () => {
    CONNECTED_SPEECH_DATA.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.phrase).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.connectedIpa).toMatch(/^\/.*\/$/);
      expect(item.isolatedIpa).toMatch(/^\/.*\/$/);
      expect(item.linkedWords.length).toBe(2);
      expect(item.explanationEs).toBeTruthy();
      expect(item.howItSoundsEs).toBeTruthy();
    });
  });
});
