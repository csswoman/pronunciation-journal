import { describe, it, expect } from "vitest";
import { extractSuggestions, stripSuggestions } from "../message-formatting";

describe("extractSuggestions", () => {
  it("extracts items from a standard suggestions: block", () => {
    const text = `Here is a lesson.

suggestions:
- I think it's my book.
- Can you give me another example?
- Can you explain that more simply?`;

    expect(extractSuggestions(text)).toEqual([
      "I think it's my book.",
      "Can you give me another example?",
      "Can you explain that more simply?",
    ]);
  });

  it("extracts items with bold header **Suggestions:** or Suggestions:", () => {
    const text = `Explanation here.

**Suggestions:**
- Option A
- Option B
- Option C`;

    expect(extractSuggestions(text)).toEqual(["Option A", "Option B", "Option C"]);
  });

  it("extracts trailing first-person reply bullets when model forgets the suggestions header", () => {
    const text = `Now, tell me: how would you say "Este es mi libro" in English?

• I think it is "This is my book."
• Can you give me another example?
• Can you explain it more simply?`;

    expect(extractSuggestions(text)).toEqual([
      'I think it is "This is my book."',
      "Can you give me another example?",
      "Can you explain it more simply?",
    ]);
  });

  it("returns empty array if there are no suggestions or trailing reply bullets", () => {
    const text = `Just a plain message without suggestions.
And another line.`;
    expect(extractSuggestions(text)).toEqual([]);
  });
});

describe("stripSuggestions", () => {
  it("strips standard suggestions: block from prose", () => {
    const text = `Here is a lesson on adjectives.

suggestions:
- I think it's my book.
- Can you give me another example?
- Can you explain that more simply?`;

    expect(stripSuggestions(text)).toBe("Here is a lesson on adjectives.");
  });

  it("strips **Suggestions:** block from prose", () => {
    const text = `Here is a lesson.

**Suggestions:**
- Option 1
- Option 2`;

    expect(stripSuggestions(text)).toBe("Here is a lesson.");
  });

  it("strips trailing bullet replies when extracted as suggestions", () => {
    const text = `Now, tell me: how would you say "Este es mi libro" in English?

• I think it is "This is my book."
• Can you give me another example?
• Can you explain it more simply?`;

    expect(stripSuggestions(text)).toBe('Now, tell me: how would you say "Este es mi libro" in English?');
  });

  it("leaves normal message untouched if no suggestions exist", () => {
    const text = "Normal text with no suggestions.";
    expect(stripSuggestions(text)).toBe("Normal text with no suggestions.");
  });
});
