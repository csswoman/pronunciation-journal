import { describe, it, expect } from "vitest";
import { extractTurnCorrection, extractTurnSaveables, extractTurnConcept } from "../correction";
import type { ToolCall } from "../types";

function callMap(calls: ToolCall[]): Map<string, ToolCall> {
  return new Map(calls.map((c) => [c.id, c]));
}

describe("extractTurnCorrection", () => {
  it("returns the correction carried by an annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "answered",
        args: {
          correction: {
            original: "I go yesterday",
            corrected: "I went yesterday",
            rule: "Pasado simple",
            kind: "error",
          },
        },
      },
    ]);
    expect(extractTurnCorrection(calls)).toEqual({
      original: "I go yesterday",
      corrected: "I went yesterday",
      rule: "Pasado simple",
      kind: "error",
    });
  });

  it("returns null when annotate_turn carried no correction", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "answered", args: { saveables: [] } },
    ]);
    expect(extractTurnCorrection(calls)).toBeNull();
  });

  it("returns null when there is no annotate_turn call at all", () => {
    const calls = callMap([
      { id: "c1", name: "render_word_card", status: "rendered", args: { word: "a", meaning: "b" } },
    ]);
    expect(extractTurnCorrection(calls)).toBeNull();
  });

  it("ignores an annotate_turn call that errored", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "error", args: {}, error: "boom", errorId: "e1" },
    ]);
    expect(extractTurnCorrection(calls)).toBeNull();
  });

  it("returns null for an empty map", () => {
    expect(extractTurnCorrection(new Map())).toBeNull();
  });
});

describe("extractTurnSaveables", () => {
  it("returns the saveables carried by an annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "answered",
        args: {
          saveables: [{ type: "word", text: "creepy", meaning: "escalofriante" }],
        },
      },
    ]);
    expect(extractTurnSaveables(calls)).toEqual([
      { type: "word", text: "creepy", meaning: "escalofriante" },
    ]);
  });

  it("returns an empty array when annotate_turn carried none", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "answered", args: { correction: undefined } },
    ]);
    expect(extractTurnSaveables(calls)).toEqual([]);
  });

  it("returns an empty array when there is no annotate_turn call", () => {
    expect(extractTurnSaveables(new Map())).toEqual([]);
  });

  it("ignores an annotate_turn call that errored", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "error", args: {}, error: "boom", errorId: "e1" },
    ]);
    expect(extractTurnSaveables(calls)).toEqual([]);
  });
});

describe("extractTurnConcept", () => {
  it("returns the concept carried by an annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "answered",
        args: { concept: { title: '"actually" — falso amigo' } },
      },
    ]);
    expect(extractTurnConcept(calls)).toEqual({ title: '"actually" — falso amigo' });
  });

  it("returns null when no annotate_turn call carries a concept", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "answered", args: { saveables: [] } },
    ]);
    expect(extractTurnConcept(calls)).toBeNull();
  });

  it("ignores an errored annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "error",
        args: { concept: { title: "x" } },
      },
    ]);
    expect(extractTurnConcept(calls)).toBeNull();
  });
});

// ─── pickCorrectionToRecord ───────────────────────────────────────────────────

import { pickCorrectionToRecord } from "../correction";
import type { ErrorPatternId } from "@/lib/exercises/error-patterns";

describe("pickCorrectionToRecord", () => {
  it("returns the errorPattern when kind is error and not yet recorded", () => {
    expect(
      pickCorrectionToRecord(
        { original: "a", corrected: "b", rule: "r", kind: "error", errorPattern: "spelling" },
        new Set(),
      ),
    ).toBe("spelling");
  });

  it("returns undefined when the pattern was already recorded", () => {
    const recorded = new Set<ErrorPatternId>(["spelling"]);
    expect(
      pickCorrectionToRecord(
        { original: "a", corrected: "b", rule: "r", kind: "error", errorPattern: "spelling" },
        recorded,
      ),
    ).toBeUndefined();
  });

  it("returns undefined when kind is 'unnatural'", () => {
    expect(
      pickCorrectionToRecord(
        { original: "a", corrected: "b", rule: "r", kind: "unnatural", errorPattern: "spelling" as ErrorPatternId },
        new Set(),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when errorPattern is absent", () => {
    expect(
      pickCorrectionToRecord(
        { original: "a", corrected: "b", rule: "r", kind: "error" },
        new Set(),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when correction is null", () => {
    expect(pickCorrectionToRecord(null, new Set())).toBeUndefined();
  });
});
