import { describe, it, expect } from "vitest";
import {
  buildReviewStarterPrompt,
  buildLearnStarterPrompt,
  buildWorldStarterPrompt,
  buildFreeStarterPrompt,
  STARTER_ANGLES,
} from "@/lib/ai-prompts";

describe("buildFreeStarterPrompt", () => {
  it("tells the model the student picks the topic", () => {
    const prompt = buildFreeStarterPrompt();
    expect(prompt).toMatch(/THEY choose the topic/i);
  });

  it("forbids proposing a topic or a warm-up question", () => {
    const prompt = buildFreeStarterPrompt();
    expect(prompt).toMatch(/Do NOT propose a topic/i);
    expect(prompt).toMatch(/Do NOT ask a warm-up question/i);
  });

  it("asks for a one-sentence greeting", () => {
    expect(buildFreeStarterPrompt()).toMatch(/ONE short sentence/i);
  });
});

describe("buildReviewStarterPrompt", () => {
  it("names the concrete thing the student got wrong", () => {
    const prompt = buildReviewStarterPrompt({
      focus: "Pasado simple irregular",
      failCount: 3,
    });
    expect(prompt).toContain("Pasado simple irregular");
    expect(prompt).toContain("3");
  });

  it("asks for practice, not a lecture", () => {
    const prompt = buildReviewStarterPrompt({ focus: "articles", failCount: 2 });
    expect(prompt).toMatch(/exercise|practice/i);
  });
});

describe("buildLearnStarterPrompt", () => {
  it("states the student's level", () => {
    const prompt = buildLearnStarterPrompt({
      level: "B1",
      avoidTopics: ["present perfect"],
      angle: "a phrasal verb they will actually use",
    });
    expect(prompt).toContain("B1");
  });

  it("tells the model which topics to avoid", () => {
    const prompt = buildLearnStarterPrompt({
      level: "B1",
      avoidTopics: ["present perfect", "modals"],
      angle: "an idiom",
    });
    expect(prompt).toContain("present perfect, modals");
  });

  it("carries the chosen angle", () => {
    const prompt = buildLearnStarterPrompt({
      level: "A2",
      avoidTopics: [],
      angle: "a false friend for Spanish speakers",
    });
    expect(prompt).toContain("a false friend for Spanish speakers");
  });

  it("does not mention avoided topics when there are none", () => {
    const prompt = buildLearnStarterPrompt({ level: "A2", avoidTopics: [], angle: "x" });
    expect(prompt).not.toMatch(/Avoid these topics/i);
  });
});

describe("buildWorldStarterPrompt", () => {
  it("centres the conversation on the chosen interest", () => {
    const prompt = buildWorldStarterPrompt({
      interest: "gaming",
      knownWords: ["level", "player"],
      angle: "a real situation",
    });
    expect(prompt).toContain("gaming");
  });

  it("lists words the student already knows so they are not re-taught", () => {
    const prompt = buildWorldStarterPrompt({
      interest: "food",
      knownWords: ["recipe", "spicy"],
      angle: "ordering something",
    });
    expect(prompt).toContain("recipe, spicy");
  });
});

describe("STARTER_ANGLES", () => {
  it("gives learn and world enough angles to rotate without repeating soon", () => {
    expect(STARTER_ANGLES.learn.length).toBeGreaterThanOrEqual(5);
    expect(STARTER_ANGLES.world.length).toBeGreaterThanOrEqual(5);
  });

  it("has no duplicate angles within a starter", () => {
    for (const angles of Object.values(STARTER_ANGLES)) {
      expect(new Set(angles).size).toBe(angles.length);
    }
  });
});
