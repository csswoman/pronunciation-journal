import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";

const quickAddWord = vi.fn();
const toggleFavorite = vi.fn();
const saveTrackedItem = vi.fn();

vi.mock("@/lib/word-bank/queries", () => ({
  quickAddWord: (...args: unknown[]) => quickAddWord(...args),
  toggleFavorite: (...args: unknown[]) => toggleFavorite(...args),
  DuplicateWordError: class DuplicateWordError extends Error {
    constructor(readonly wordId: string, readonly text: string) {
      super(text);
      this.name = "DuplicateWordError";
    }
  },
}));

vi.mock("@/lib/tracking/queries", () => ({
  saveTrackedItem: (...args: unknown[]) => saveTrackedItem(...args),
}));

const { persistSaveable } = await import("../persist");
const { DuplicateWordError } = await import("@/lib/word-bank/queries");

const WORD: TurnSaveable = {
  type: "word",
  text: "creepy",
  meaning: "escalofriante",
  example: "That old house looks creepy.",
};

const PHRASE: TurnSaveable = {
  type: "phrase",
  text: "that sounds creepy",
  meaning: "eso suena escalofriante",
};

beforeEach(() => {
  quickAddWord.mockReset();
  toggleFavorite.mockReset();
  saveTrackedItem.mockReset();
});

describe("persistSaveable: words", () => {
  it("adds the word to the word bank tagged as coach-sourced", async () => {
    quickAddWord.mockResolvedValue({ id: "w1" });
    await persistSaveable("u1", WORD);

    expect(quickAddWord).toHaveBeenCalledWith({
      text: "creepy",
      context: "That old house looks creepy.",
      source: "ai_coach",
    });
  });

  it("favourites the new word so it shows up in Guardadas", async () => {
    quickAddWord.mockResolvedValue({ id: "w1" });
    await persistSaveable("u1", WORD);
    expect(toggleFavorite).toHaveBeenCalledWith("w1", true);
  });

  it("omits context when the saveable has no example", async () => {
    quickAddWord.mockResolvedValue({ id: "w1" });
    await persistSaveable("u1", { ...WORD, example: undefined });
    expect(quickAddWord).toHaveBeenCalledWith({
      text: "creepy",
      source: "ai_coach",
    });
  });

  it("favourites the existing word when it was already saved", async () => {
    quickAddWord.mockRejectedValue(new DuplicateWordError("w-existing", "creepy"));
    await expect(persistSaveable("u1", WORD)).resolves.toBeUndefined();
    expect(toggleFavorite).toHaveBeenCalledWith("w-existing", true);
  });

  it("propagates a genuine failure so the chip can show a retry", async () => {
    quickAddWord.mockRejectedValue(new Error("network down"));
    await expect(persistSaveable("u1", WORD)).rejects.toThrow("network down");
  });
});

describe("persistSaveable: phrases", () => {
  it("saves the phrase as a tracked item tagged as coach-sourced", async () => {
    await persistSaveable("u1", PHRASE);

    expect(saveTrackedItem).toHaveBeenCalledWith({
      userId: "u1",
      kind: "phrase",
      ref: "that sounds creepy",
      title: "that sounds creepy",
      payload: {
        text: "that sounds creepy",
        meaning: "eso suena escalofriante",
        source: "ai_coach",
      },
    });
  });

  it("lowercases the ref so the same phrase is not saved twice", async () => {
    await persistSaveable("u1", { ...PHRASE, text: "That Sounds Creepy" });
    expect(saveTrackedItem).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "that sounds creepy", title: "That Sounds Creepy" }),
    );
  });

  it("does not touch the word bank for a phrase", async () => {
    await persistSaveable("u1", PHRASE);
    expect(quickAddWord).not.toHaveBeenCalled();
  });
});
