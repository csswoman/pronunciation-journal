import { describe, expect, it } from "vitest";
import { compileMarkedText, StudyMarkupError } from "../study-markup";

describe("compileMarkedText", () => {
  it("removes markup and returns end-exclusive highlight ranges", () => {
    expect(compileMarkedText("**The** book is on **the** table.")).toEqual({
      text: "The book is on the table.",
      highlights: [
        { start: 0, end: 3 },
        { start: 15, end: 18 },
      ],
    });
  });

  it("allows literal asterisks only through the explicit escape", () => {
    expect(compileMarkedText("Read \\** carefully and **listen**.")).toEqual({
      text: "Read ** carefully and listen.",
      highlights: [{ start: 22, end: 28 }],
    });
  });

  it("rejects an unclosed marker", () => {
    expect(() => compileMarkedText("Read **this")).toThrow(StudyMarkupError);
  });

  it("rejects an empty marker", () => {
    expect(() => compileMarkedText("Read **** now")).toThrow(/vacío/);
  });
});
