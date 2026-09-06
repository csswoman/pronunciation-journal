import { describe, it, expect } from "vitest";
import {
  buildReviewStarterPrompt,
  buildLearnStarterPrompt,
  buildWorldStarterPrompt,
  buildFreeStarterPrompt,
  buildPronunciationStarterPrompt,
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

  // Regression: forcing an exercise tool call on the opening turn made the model
  // emit a truncated function call that the stream could not parse, so the coach
  // turn failed silently. Turn 1 must stay plain text.
  it("forbids calling an exercise tool on the first turn", () => {
    const prompt = buildLearnStarterPrompt({ level: "A1", avoidTopics: [], angle: "x" });
    expect(prompt).toMatch(/Do NOT call any exercise tool on this first turn/i);
    expect(prompt).toMatch(/wait until they reply/i);
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

  // Regression: see buildLearnStarterPrompt above — no tool call on turn 1.
  it("forbids calling a tool on the first turn", () => {
    const prompt = buildWorldStarterPrompt({ interest: "music", knownWords: [], angle: "x" });
    expect(prompt).toMatch(/do NOT call any\s*\n?\s*tool on this first turn/i);
  });
});

describe("buildLearnStarterPrompt syllabus topics", () => {
  it("lists the syllabus topics when provided", () => {
    const prompt = buildLearnStarterPrompt({
      level: "A1",
      avoidTopics: [],
      angle: "x",
      syllabusTopics: ["Ser y estar (to be) (am · is · are)", "Artículos básicos (a · an · the)"],
    });
    expect(prompt).toMatch(/from this student's A1 syllabus/i);
    expect(prompt).toContain("Ser y estar (to be) (am · is · are)");
  });

  it("omits the syllabus block when the list is empty", () => {
    const prompt = buildLearnStarterPrompt({ level: "A1", avoidTopics: [], angle: "x", syllabusTopics: [] });
    expect(prompt).not.toMatch(/syllabus/i);
  });
});

describe("buildPronunciationStarterPrompt", () => {
  it("states the level and forbids a tool call on turn 1", () => {
    const prompt = buildPronunciationStarterPrompt({ level: "A1" });
    expect(prompt).toContain("level A1");
    expect(prompt).toMatch(/Do NOT call any tool on this first turn/i);
  });

  it("lists the level's sound targets when given", () => {
    const prompt = buildPronunciationStarterPrompt({
      level: "A1",
      soundTargets: ["Bilabial/labiodental contrast (b/v)", "Open vowel contrast (æ/ʌ)"],
    });
    expect(prompt).toContain("Bilabial/labiodental contrast (b/v)");
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
