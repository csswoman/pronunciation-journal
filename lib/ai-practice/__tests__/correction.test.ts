import { describe, it, expect } from "vitest";
import { extractTurnCorrection, extractTurnSaveables } from "../correction";
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
