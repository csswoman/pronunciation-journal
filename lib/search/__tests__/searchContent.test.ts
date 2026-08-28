import { describe, expect, it } from "vitest";
import { getContentIndex, type ContentItem } from "../contentIndex";
import { searchContent } from "../searchContent";

const index: ContentItem[] = [
  { id: "sound:schwa", type: "sound", title: "/ə/ — Schwa", tags: ["Sound Lab", "vocal"], description: "Vocal sin acento.", path: "/practice/sounds" },
  { id: "lesson:articles", type: "lesson", title: "A, An, The", tags: ["Mini lecciones", "gramática"], description: "Artículos básicos.", path: "/mini-lessons/articles-a-an-the" },
];

describe("searchContent", () => {
  it("encuentra coincidencias fuzzy en título, tags y descripción", () => {
    expect(searchContent("shwa", index).map((item) => item.id)).toEqual(["sound:schwa"]);
    expect(searchContent("gramatica", index).map((item) => item.id)).toEqual(["lesson:articles"]);
  });

  it("does not return content until there is a query", () => {
    expect(searchContent("  ", index)).toEqual([]);
  });

  it("prioritizes learning content over Lexicon matches", () => {
    const sharedQuery: ContentItem[] = [
      { id: "lexicon:grammar", type: "lexicon", title: "Grammar glossary", tags: ["gramática"], description: "Término del diccionario.", path: "/words" },
      { id: "lesson:grammar", type: "lesson", title: "Gramática básica", tags: ["gramática"], description: "Mini lección.", path: "/mini-lessons/grammar" },
    ];

    expect(searchContent("gramatica", sharedQuery).map((item) => item.id)).toEqual([
      "lesson:grammar",
      "lexicon:grammar",
    ]);
  });

  it("exposes the generated immutable index as a pure value", () => {
    expect(getContentIndex()).not.toHaveLength(0);
    expect(getContentIndex()).toEqual(getContentIndex());
  });
});
