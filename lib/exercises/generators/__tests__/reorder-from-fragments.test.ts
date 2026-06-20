import { describe, expect, it } from "vitest";
import { generateReorderFromFragments } from "../reorder-from-fragments";
import type { TextFragment } from "../reorder-from-fragments";

function frag(id: string, content: string): TextFragment {
  return { id, content, source: null, title: null };
}

const fragments = [
  frag("a", "the cat sat on the mat"),
  frag("b", "she walks to the shop"),
  frag("c", "they read books every night"),
];

describe("generateReorderFromFragments", () => {
  it("preserveOrder keeps the caller-supplied order (SRS-due first)", () => {
    const out = generateReorderFromFragments(fragments, 2, { preserveOrder: true });
    expect(out.map((e) => e.sourceRef.id)).toEqual(["a", "b"]);
  });

  it("filters out fragments below the minimum token count", () => {
    const tooShort = [frag("x", "go now"), frag("y", "one two three four five")];
    const out = generateReorderFromFragments(tooShort, 5, { preserveOrder: true });
    expect(out.map((e) => e.sourceRef.id)).toEqual(["y"]);
  });

  it("rejects notation rows mislabeled as sentences", () => {
    const polluted = [
      frag("arrow", "going to → gonna already known"),
      frag("slash", "turn off / turn it off please"),
      frag("good", "she walks to the shop"),
    ];
    const out = generateReorderFromFragments(polluted, 5, { preserveOrder: true });
    expect(out.map((e) => e.sourceRef.id)).toEqual(["good"]);
  });
});
