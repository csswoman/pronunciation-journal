import { describe, it, expect } from "vitest";
import { domainForCategory, studyModeForCategory, LEXICON_DOMAINS } from "../domains";

describe("studyModeForCategory", () => {
  it("marks engineering categories as receptive", () => {
    expect(studyModeForCategory("artificial-intelligence")).toBe("receptive");
    expect(studyModeForCategory("backend-infra")).toBe("receptive");
    expect(studyModeForCategory("data-science")).toBe("receptive");
    expect(studyModeForCategory("frontend-dev")).toBe("receptive");
  });

  it("marks design categories as receptive", () => {
    expect(studyModeForCategory("ux-design")).toBe("receptive");
    expect(studyModeForCategory("design-systems")).toBe("receptive");
  });

  it("marks professional categories as productive", () => {
    expect(studyModeForCategory("professional")).toBe("productive");
    expect(studyModeForCategory("technical-writing")).toBe("productive");
    expect(studyModeForCategory("personal-interview")).toBe("productive");
  });

  it("defaults an unknown category to productive, matching domainForCategory's fallback", () => {
    expect(studyModeForCategory("some-future-category")).toBe("productive");
    expect(domainForCategory("some-future-category")).toBe("professional");
  });

  it("every domain declares a studyMode", () => {
    for (const domain of LEXICON_DOMAINS) {
      expect(["receptive", "productive"]).toContain(domain.studyMode);
    }
  });
});
