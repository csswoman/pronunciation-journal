import { describe, expect, it } from "vitest";
import { prioritizeFragmentsByDue } from "../fragment-priority";
import type { TextFragment } from "@/lib/exercises/generators/reorder-from-fragments";
import type { SRSData } from "@/lib/types";

function frag(id: string): TextFragment {
  return { id, content: `sentence ${id}`, source: null, title: null };
}

function srs(id: string, nextReview: string): SRSData {
  return {
    wordId: `fragment:${id}`,
    word: `fragment:${id}`,
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview,
  };
}

const NOW = new Date("2026-06-19T00:00:00.000Z");

describe("prioritizeFragmentsByDue", () => {
  it("orders due fragments first, then unseen, then not-yet-due", () => {
    const fragments = [
      frag("not-due"), // reviewed, future date
      frag("due"), // reviewed, past date
      frag("unseen"), // never reviewed
    ];
    const srsByKey = new Map<string, SRSData>([
      ["fragment:not-due", srs("not-due", "2026-06-25T00:00:00.000Z")],
      ["fragment:due", srs("due", "2026-06-10T00:00:00.000Z")],
    ]);

    const ordered = prioritizeFragmentsByDue(fragments, srsByKey, NOW);

    expect(ordered.map((f) => f.id)).toEqual(["due", "unseen", "not-due"]);
  });

  it("is stable for an empty srs map (all unseen, order preserved)", () => {
    const fragments = [frag("a"), frag("b"), frag("c")];
    const ordered = prioritizeFragmentsByDue(fragments, new Map(), NOW);
    expect(ordered.map((f) => f.id)).toEqual(["a", "b", "c"]);
  });

  it("treats a fragment due exactly now as due", () => {
    const fragments = [frag("exact")];
    const srsByKey = new Map<string, SRSData>([
      ["fragment:exact", srs("exact", NOW.toISOString())],
    ]);
    const ordered = prioritizeFragmentsByDue(fragments, srsByKey, NOW);
    expect(ordered.map((f) => f.id)).toEqual(["exact"]);
  });
});
