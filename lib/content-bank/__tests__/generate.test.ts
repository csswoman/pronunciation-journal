import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateBankSet } from "../generate";
import * as jsonRoute from "@/lib/gemini/json-route";

vi.mock("@/lib/gemini/json-route", () => ({
  callGeminiJson: vi.fn(),
  parseGeminiJson: vi.fn((raw, parser) => parser(typeof raw === "string" ? JSON.parse(raw) : raw)),
}));

describe("generateBankSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const valid5Items = [
    {
      tool_name: "render_multiple_choice",
      payload: {
        question: "Which sentence uses the past simple correctly?",
        options: ["I went home", "I goed home", "I going home"],
        correctIndex: 0,
        explanation: "Went is the irregular past tense of go.",
        instruction: "Select the correct past simple verb.",
        learningGoal: "Practice irregular past verbs.",
        commonWrongAnswers: [{ value: "I goed home", feedback: "Go is irregular." }],
        hint: { level1: "Think about irregular verbs", level2: "Go becomes went" },
      },
    },
    {
      tool_name: "render_multiple_choice",
      payload: {
        question: "Choose the correct preposition: She arrived ___ the station.",
        options: ["at", "in", "on"],
        correctIndex: 0,
        explanation: "We use 'arrive at' for specific points like stations.",
        instruction: "Choose the right preposition.",
        learningGoal: "Prepositions of place.",
      },
    },
    {
      tool_name: "render_fill_blank",
      payload: {
        sentence: "Yesterday, she ___ (eat) dinner early.",
        answer: "ate",
        acceptableAnswers: ["ate"],
        instruction: "Fill in the blank with the past tense of eat.",
        learningGoal: "Irregular past tense.",
        hint: { level1: "Irregular past verb", level2: "Changes vowel to a" },
      },
    },
    {
      tool_name: "render_fill_blank",
      payload: {
        sentence: "They ___ (be) very tired after the trip.",
        answer: "were",
        acceptableAnswers: ["were"],
        instruction: "Complete with past of to be.",
        learningGoal: "Past tense of to be.",
      },
    },
    {
      tool_name: "render_speaking",
      payload: {
        prompt: "Say the sentence aloud: I went to the store yesterday.",
        target: "I went to the store yesterday",
        ipa: "/aɪ wɛnt tu ðə stɔːr ˈjɛstərdeɪ/",
      },
    },
  ];

  it("returns 5 valid candidates when Gemini returns 5 valid items", async () => {
    vi.mocked(jsonRoute.callGeminiJson).mockResolvedValueOnce({
      data: { exercises: valid5Items as unknown as Array<{ tool_name: string; payload: Record<string, unknown> }> },
      response: null,
    });

    const candidates = await generateBankSet("A2", "past_simple");
    expect(candidates).toHaveLength(5);
    expect(candidates[0].tool_name).toBe("render_multiple_choice");
    expect(candidates[0].stem_hash).toBeDefined();
    expect(candidates[0].payload.topic).toBe("past_simple");
    expect(candidates[4].tool_name).toBe("render_speaking");
  });

  it("discards invalid items (5 returned, 1 invalid -> 4 rows returned)", async () => {
    const itemsWithOneInvalid = [
      ...valid5Items.slice(0, 4),
      {
        tool_name: "render_fill_blank",
        payload: {
          // Missing sentence and answer!
          topic: "past_simple",
        },
      },
    ];

    vi.mocked(jsonRoute.callGeminiJson).mockResolvedValueOnce({
      data: { exercises: itemsWithOneInvalid as unknown as Array<{ tool_name: string; payload: Record<string, unknown> }> },
      response: null,
    });

    const candidates = await generateBankSet("A2", "past_simple");
    expect(candidates).toHaveLength(4);
  });

  it("returns empty array if Gemini call fails or returns empty data", async () => {
    vi.mocked(jsonRoute.callGeminiJson).mockResolvedValueOnce({
      data: null,
      response: null,
    });

    const candidates = await generateBankSet("B1", "daily_routines");
    expect(candidates).toEqual([]);
  });
});
