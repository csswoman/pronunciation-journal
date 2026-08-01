import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { FalseFriendChunkSchema, FalseFriendSchema, GAP_TOKEN } from "../schema";
import type { FalseFriend } from "../types";

function makeEntry(overrides: Partial<FalseFriend> = {}): unknown {
  return {
    id: "actually",
    word: "actually",
    looksLike: "actualmente",
    actualMeaning: "en realidad",
    correctWord: "currently",
    kind: "meaning-shift",
    cefr_level: "A2",
    prompts: [
      {
        sentence: "I ___ live in Madrid.",
        options: ["currently", "actually"],
        answer: 0,
        explain: "Actualmente es currently.",
      },
    ],
    ...overrides,
  };
}

describe("FalseFriendSchema", () => {
  it("accepts a well-formed entry", () => {
    expect(FalseFriendSchema.safeParse(makeEntry()).success).toBe(true);
  });

  it("rejects a prompt with no gap", () => {
    const entry = makeEntry({
      prompts: [
        {
          sentence: "I currently live in Madrid.",
          options: ["currently", "actually"],
          answer: 0,
          explain: "…",
        },
      ],
    });
    expect(FalseFriendSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects a prompt with two gaps", () => {
    const entry = makeEntry({
      prompts: [
        {
          sentence: `I ${GAP_TOKEN} live in ${GAP_TOKEN}.`,
          options: ["currently", "actually"],
          answer: 0,
          explain: "…",
        },
      ],
    });
    expect(FalseFriendSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects an answer index outside the options", () => {
    const entry = makeEntry({
      prompts: [
        {
          sentence: "I ___ live in Madrid.",
          options: ["currently", "actually"],
          answer: 5,
          explain: "…",
        },
      ],
    });
    expect(FalseFriendSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects duplicate options", () => {
    const entry = makeEntry({
      prompts: [
        {
          sentence: "I ___ live in Madrid.",
          options: ["currently", "Currently"],
          answer: 0,
          explain: "…",
        },
      ],
    });
    expect(FalseFriendSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects options that omit the trap word", () => {
    const entry = makeEntry({
      prompts: [
        {
          sentence: "I ___ live in Madrid.",
          options: ["currently", "presently"],
          answer: 0,
          explain: "…",
        },
      ],
    });
    expect(FalseFriendSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects word equal to correctWord", () => {
    expect(FalseFriendSchema.safeParse(makeEntry({ correctWord: "actually" })).success).toBe(false);
  });

  it("rejects a non-kebab-case id", () => {
    expect(FalseFriendSchema.safeParse(makeEntry({ id: "Actually Now" })).success).toBe(false);
  });
});

describe("authored content", () => {
  const dir = path.join(process.cwd(), "public", "false-friends");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  it("ships at least one chunk", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s validates against the schema", (file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    const result = FalseFriendChunkSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`${file}:\n${JSON.stringify(result.error.issues, null, 2)}`);
    }
    expect(result.success).toBe(true);
  });

  it("has globally unique ids", () => {
    const ids = files.flatMap((file) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      return (raw.entries as FalseFriend[]).map((e) => e.id);
    });
    expect(new Set(ids).size).toBe(ids.length);
  });
});
