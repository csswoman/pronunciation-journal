import { describe, it, expect } from "vitest";
import {
  evaluateConnectedSpeechTranscript,
  connectedSpeechErrorMessage,
} from "../connected-speech-evaluation";

describe("evaluateConnectedSpeechTranscript", () => {
  it("marks every word heard for an exact transcript", () => {
    const result = evaluateConnectedSpeechTranscript("Pick it up", "pick it up");
    expect(result.heardCount).toBe(3);
    expect(result.isCorrect).toBe(true);
  });

  it("ignores case, punctuation and apostrophes", () => {
    const result = evaluateConnectedSpeechTranscript("What's up?", "whats up");
    expect(result.isCorrect).toBe(true);
  });

  it("flags missing words without failing the whole phrase", () => {
    const result = evaluateConnectedSpeechTranscript("Pick it up", "pick up");
    expect(result.words).toEqual([
      { word: "Pick", heard: true },
      { word: "it", heard: false },
      { word: "up", heard: true },
    ]);
    expect(result.heardCount).toBe(2);
    expect(result.isCorrect).toBe(false);
  });

  it("counts a repeated word only as often as it was said", () => {
    const result = evaluateConnectedSpeechTranscript("bye bye", "bye");
    expect(result.heardCount).toBe(1);
  });

  it("treats an empty transcript as nothing heard", () => {
    const result = evaluateConnectedSpeechTranscript("Pick it up", "");
    expect(result.heardCount).toBe(0);
    expect(result.isCorrect).toBe(false);
  });
});

describe("connectedSpeechErrorMessage", () => {
  it("explains a denied microphone", () => {
    expect(connectedSpeechErrorMessage("not-allowed")).toMatch(/micrófono/);
  });

  it("explains silence", () => {
    expect(connectedSpeechErrorMessage("no-speech")).toMatch(/No detectamos tu voz/);
  });
});
