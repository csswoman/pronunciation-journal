import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentItem } from "../contentIndex";
import { searchContent } from "../searchContent";

const index: ContentItem[] = [
  {
    id: "sound:schwa",
    type: "sound",
    title: "/ə/ — Schwa",
    tags: ["Sound Lab", "vocal"],
    description: "Vocal sin acento.",
    path: "/practice/sounds",
  },
  {
    id: "lesson:articles",
    type: "lesson",
    title: "A, An, The",
    tags: ["Mini lecciones", "gramática"],
    description: "Artículos básicos.",
    path: "/mini-lessons/articles-a-an-the",
  },
];

describe("searchContent", () => {
  it("encuentra coincidencias fuzzy en título, tags y descripción", () => {
    expect(searchContent("shwa", index).map((item) => item.id)).toEqual(["sound:schwa"]);
    expect(searchContent("gramatica", index).map((item) => item.id)).toEqual([
      "lesson:articles",
    ]);
  });

  it("does not return content until there is a query", () => {
    expect(searchContent("  ", index)).toEqual([]);
  });

  it("prioritizes learning content over Lexicon matches", () => {
    const sharedQuery: ContentItem[] = [
      {
        id: "lexicon:grammar",
        type: "lexicon",
        title: "Grammar glossary",
        tags: ["gramática"],
        description: "Término del diccionario.",
        path: "/words",
      },
      {
        id: "lesson:grammar",
        type: "lesson",
        title: "Gramática básica",
        tags: ["gramática"],
        description: "Mini lección.",
        path: "/mini-lessons/grammar",
      },
    ];

    expect(searchContent("gramatica", sharedQuery).map((item) => item.id)).toEqual([
      "lesson:grammar",
      "lexicon:grammar",
    ]);
  });
});

describe("loadContentIndex", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries after failure and caches a successful validated JSON response", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network unavailable"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => index,
      } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const { ContentIndexLoadError, loadContentIndex } = await import("../contentIndex");

    await expect(loadContentIndex()).rejects.toBeInstanceOf(ContentIndexLoadError);
    const firstLoad = await loadContentIndex();
    const secondLoad = await loadContentIndex();

    expect(firstLoad).toEqual(index);
    expect(secondLoad).toBe(firstLoad);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/search/content-index.json", {
      headers: { Accept: "application/json" },
    });
  });

  it("rejects a JSON response with an invalid item shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: "missing-fields" }],
      } as Response),
    );
    const { ContentIndexLoadError, loadContentIndex } = await import("../contentIndex");

    await expect(loadContentIndex()).rejects.toBeInstanceOf(ContentIndexLoadError);
  });
});
