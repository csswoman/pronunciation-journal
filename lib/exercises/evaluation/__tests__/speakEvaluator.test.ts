import { describe, expect, it, vi } from "vitest";
import { evaluateSpeak } from "../speakEvaluator";
import { findArticulationGuide } from "@/lib/sounds/articulation-guides";
import type { EvaluationInput } from "../types";

vi.mock("@/lib/pronunciation/scoring", () => ({
  scorePronunciation: vi.fn(),
}));

import { scorePronunciation } from "@/lib/pronunciation/scoring";
const mockedScore = vi.mocked(scorePronunciation);

describe("findArticulationGuide", () => {
  it("resolves phonemes with slashes", () => {
    const guide = findArticulationGuide("/θ/");
    expect(guide).not.toBeNull();
    expect(guide?.phoneme).toBe("/θ/");
    expect(guide?.biomechanicsTip).toContain("garganta");
  });

  it("resolves phonemes without slashes", () => {
    const guide = findArticulationGuide("ð");
    expect(guide).not.toBeNull();
    expect(guide?.phoneme).toBe("/ð/");
  });

  it("resolves common ARPAbet aliases", () => {
    expect(findArticulationGuide("th")?.phoneme).toBe("/θ/");
    expect(findArticulationGuide("dh")?.phoneme).toBe("/ð/");
    expect(findArticulationGuide("iy")?.phoneme).toBe("/iː/");
    expect(findArticulationGuide("ih")?.phoneme).toBe("/ɪ/");
  });

  it("returns null for unknown phonemes or empty input", () => {
    expect(findArticulationGuide("")).toBeNull();
    expect(findArticulationGuide("xyz")).toBeNull();
  });
});

describe("evaluateSpeak biomechanical feedback", () => {
  const baseInput: EvaluationInput = {
    exercise: { domain: "pronunciation", mode: "speak", variant: "phoneme" },
    expected: "think",
    actual: { kind: "speech", transcript: "sink" },
    userLevel: "B1",
  };

  it("provides biomechanical feedback when pronunciation fails on a known phoneme", async () => {
    mockedScore.mockResolvedValueOnce({
      accuracy: 45,
      isCorrect: false,
      transcript: "sink",
      wordResults: [
        {
          expected: "think",
          got: "sink",
          status: "incorrect",
          phonemes: {
            expected: ["TH", "IH", "NG", "K"],
            got: ["S", "IH", "NG", "K"],
            tip: null,
            alignment: [
              { phoneme: "TH", ipa: "θ", status: "incorrect" },
              { phoneme: "IH", ipa: "ɪ", status: "correct" },
              { phoneme: "NG", ipa: "ŋ", status: "correct" },
              { phoneme: "K", ipa: "k", status: "correct" },
            ],
          },
        },
      ],
    });

    const result = await evaluateSpeak(baseInput);
    expect(result.correct).toBe(false);
    expect(result.feedback.tip).toContain("garganta");
    expect(result.feedback.tip).toContain("Ojo:");
    expect(result.feedback.tip).toContain("Evita pronunciarla como una \"S\"");
  });

  it("falls back to standard phoneme message if no articulation guide is found", async () => {
    mockedScore.mockResolvedValueOnce({
      accuracy: 50,
      isCorrect: false,
      transcript: "bad",
      wordResults: [
        {
          expected: "bat",
          got: "bad",
          status: "incorrect",
          phonemes: {
            expected: ["B", "AE", "T"],
            got: ["B", "AE", "D"],
            tip: null,
            alignment: [
              { phoneme: "UNKNOWN", ipa: "unregistered_sound", status: "incorrect" },
            ],
          },
        },
      ],
    });

    const result = await evaluateSpeak(baseInput);
    expect(result.correct).toBe(false);
    expect(result.feedback.tip).toBe("Concéntrate en el sonido /unregistered_sound/: escucha el modelo e inténtalo de nuevo.");
  });

  it("enriches near-pass scores with biomechanics tip when accuracy is below 90", async () => {
    mockedScore.mockResolvedValueOnce({
      accuracy: 75,
      isCorrect: true,
      transcript: "this",
      wordResults: [
        {
          expected: "this",
          got: "this",
          status: "incorrect",
          phonemes: {
            expected: ["DH", "IH", "S"],
            got: ["D", "IH", "S"],
            tip: null,
            alignment: [
              { phoneme: "DH", ipa: "ð", status: "incorrect" },
              { phoneme: "IH", ipa: "ɪ", status: "correct" },
              { phoneme: "S", ipa: "s", status: "correct" },
            ],
          },
        },
      ],
    });

    const result = await evaluateSpeak({ ...baseInput, expected: "this" });
    expect(result.correct).toBe(true);
    expect(result.feedback.tip).toContain("Casi perfecto: cuida el sonido /ð/ en \"this\".");
    expect(result.feedback.tip).toContain("vibración o zumbido claro");
  });
});
