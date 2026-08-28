import { describe, it, expect } from "vitest";
import { deriveDomainProfile, emptyDomainProfile } from "../domain-profile";

describe("deriveDomainProfile", () => {
  it("returns an empty profile for no entries", () => {
    const profile = deriveDomainProfile([], new Map());
    expect(profile).toEqual(emptyDomainProfile());
  });

  it("ignores entries whose source is not lexicon", () => {
    const profile = deriveDomainProfile(
      [{ source: "manual", source_ref: null }, { source: "reader", source_ref: "etl" }],
      new Map([["etl", ["backend-infra"]]]),
    );
    expect(profile).toEqual(emptyDomainProfile());
  });

  it("ignores lexicon entries with a null source_ref", () => {
    const profile = deriveDomainProfile(
      [{ source: "lexicon", source_ref: null }],
      new Map([["etl", ["backend-infra"]]]),
    );
    expect(profile).toEqual(emptyDomainProfile());
  });

  it("ignores source_refs that don't resolve in the word index", () => {
    const profile = deriveDomainProfile(
      [{ source: "lexicon", source_ref: "unknown-word" }],
      new Map([["etl", ["backend-infra"]]]),
    );
    expect(profile).toEqual(emptyDomainProfile());
  });

  it("counts a word once per category it resolves to (duplicates across categories)", () => {
    const profile = deriveDomainProfile(
      [{ source: "lexicon", source_ref: "etl" }],
      new Map([["etl", ["backend-infra", "data-science"]]]),
    );
    expect(profile.categories).toEqual([
      { id: "backend-infra", name: "backend-infra", wordCount: 1 },
      { id: "data-science", name: "data-science", wordCount: 1 },
    ]);
    // Both categories are in the "engineering" domain — counts roll up together.
    expect(profile.domains).toEqual([
      { id: "engineering", label: "Engineering", wordCount: 2 },
    ]);
  });

  it("orders domains and categories by word count, descending", () => {
    const entries = [
      { source: "lexicon", source_ref: "backpropagation" },
      { source: "lexicon", source_ref: "backpropagation" },
      { source: "lexicon", source_ref: "affordance" },
    ];
    const wordIndex = new Map([
      ["backpropagation", ["artificial-intelligence"]],
      ["affordance", ["ux-design"]],
    ]);
    const profile = deriveDomainProfile(entries, wordIndex);
    expect(profile.domains.map((d) => d.id)).toEqual(["engineering", "design"]);
    expect(profile.domains[0].wordCount).toBe(2);
    expect(profile.domains[1].wordCount).toBe(1);
  });

  it("uses provided category names when given", () => {
    const profile = deriveDomainProfile(
      [{ source: "lexicon", source_ref: "etl" }],
      new Map([["etl", ["backend-infra"]]]),
      new Map([["backend-infra", "Backend & Infra"]]),
    );
    expect(profile.categories[0].name).toBe("Backend & Infra");
  });

  it("never throws on malformed input", () => {
    expect(() =>
      deriveDomainProfile(
        [{ source: "lexicon", source_ref: "" }],
        new Map(),
      ),
    ).not.toThrow();
  });
});
