import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getWordOfDay,
  isWordOfDay,
  selectDictionarySense,
} from "@/lib/word-of-day";

describe("isWordOfDay", () => {
  it("accepts valid payloads", () => {
    expect(
      isWordOfDay({
        word: "resilient",
        ipa: "/rɪˈzɪliənt/",
        definition: "Able to recover quickly.",
        example_sentence: "She is resilient.",
        difficulty: "intermediate",
      }),
    ).toBe(true);
  });

  it("rejects invalid payloads", () => {
    expect(isWordOfDay({ error: "AI service unavailable" })).toBe(false);
    expect(isWordOfDay(null)).toBe(false);
  });
});

describe("selectDictionarySense", () => {
  it("prefers adjective over a brand noun when neither has an example", () => {
    const sense = selectDictionarySense([
      {
        partOfSpeech: "noun",
        definitions: [{ definition: "A felt-tipped permanent marker." }],
      },
      {
        partOfSpeech: "adjective",
        definitions: [
          { definition: "(of perception) Clear, detailed or powerful." },
          { definition: "(of an image) Bright, intense or colourful." },
        ],
      },
    ]);

    expect(sense).toEqual({
      partOfSpeech: "adjective",
      definition: "(of perception) Clear, detailed or powerful.",
      example: "",
    });
  });

  it("prefers pedagogical POS even when a noun has an example", () => {
    const sense = selectDictionarySense([
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A felt-tipped permanent marker.",
            example: "She wrote with a Vivid.",
          },
        ],
      },
      {
        partOfSpeech: "adjective",
        definitions: [{ definition: "Bright, intense or colourful." }],
      },
    ]);

    expect(sense?.partOfSpeech).toBe("adjective");
    expect(sense?.definition).toBe("Bright, intense or colourful.");
  });

  it("keeps noun when it is the only sense with a real definition", () => {
    const sense = selectDictionarySense([
      {
        partOfSpeech: "noun",
        definitions: [{ definition: "A source of inspiration." }],
      },
      {
        partOfSpeech: "adjective",
        definitions: [{ definition: "   " }],
      },
    ]);

    expect(sense).toEqual({
      partOfSpeech: "noun",
      definition: "A source of inspiration.",
      example: "",
    });
  });

  it("returns null when there is no usable definition text", () => {
    expect(
      selectDictionarySense([
        { partOfSpeech: "noun", definitions: [{ definition: "" }] },
        { partOfSpeech: "adjective", definitions: [{ definition: "  " }] },
      ]),
    ).toBeNull();
  });
});

describe("getWordOfDay", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a fallback word when the dictionary API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const result = await getWordOfDay({ forceRefresh: true });

    expect(result.word.length).toBeGreaterThan(0);
    expect(result.definition.length).toBeGreaterThan(0);
    expect(result.difficulty).toMatch(/beginner|intermediate|advanced/);
  });

  it("surfaces the adjective sense for vivid-like dictionary payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            word: "vivid",
            phonetic: "/ˈvɪvɪd/",
            meanings: [
              {
                partOfSpeech: "noun",
                definitions: [{ definition: "A felt-tipped permanent marker." }],
              },
              {
                partOfSpeech: "adjective",
                definitions: [
                  { definition: "(of perception) Clear, detailed or powerful." },
                ],
              },
            ],
          },
        ],
      }),
    );

    const result = await getWordOfDay({ forceRefresh: true });

    expect(result.part_of_speech).toBe("adjective");
    expect(result.definition).toBe(
      "(of perception) Clear, detailed or powerful.",
    );
    expect(result.definition).not.toMatch(/marker/i);
  });
});
