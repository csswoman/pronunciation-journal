import { describe, it, expect } from "vitest";
import {
  detectPitchFromSamples,
  evaluateIntonationContour,
  type PitchPoint,
} from "../pitch-detector";

describe("detectPitchFromSamples", () => {
  it("returns 0 for pure silence", () => {
    const silence = new Float32Array(2048);
    const result = detectPitchFromSamples(silence, 44100);
    expect(result.pitchHz).toBe(0);
    expect(result.clarity).toBe(0);
  });

  it("detects 200 Hz pure sine wave accurately", () => {
    const sampleRate = 44100;
    const frequency = 200;
    const length = 2048;
    const sineWave = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      sineWave[i] = 0.8 * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    }

    const result = detectPitchFromSamples(sineWave, sampleRate);
    expect(result.pitchHz).toBeGreaterThan(195);
    expect(result.pitchHz).toBeLessThan(205);
    expect(result.clarity).toBeGreaterThan(0.7);
  });

  it("detects 120 Hz lower pitch sine wave accurately", () => {
    const sampleRate = 44100;
    const frequency = 120;
    const length = 2048;
    const sineWave = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      sineWave[i] = 0.8 * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    }

    const result = detectPitchFromSamples(sineWave, sampleRate);
    expect(result.pitchHz).toBeGreaterThan(115);
    expect(result.pitchHz).toBeLessThan(125);
    expect(result.clarity).toBeGreaterThan(0.7);
  });
});

describe("evaluateIntonationContour", () => {
  it("identifies a rising pitch pattern when final semitones increase", () => {
    const risingPoints: PitchPoint[] = [
      { timeMs: 0, pitchHz: 150, semitones: -1.0, confidence: 0.9 },
      { timeMs: 200, pitchHz: 160, semitones: 0.0, confidence: 0.9 },
      { timeMs: 400, pitchHz: 180, semitones: 1.5, confidence: 0.9 },
      { timeMs: 600, pitchHz: 210, semitones: 4.0, confidence: 0.9 },
    ];

    const result = evaluateIntonationContour(risingPoints, "rising");
    expect(result.matched).toBe(true);
    expect(result.userPattern).toBe("rising");
    expect(result.scorePct).toBeGreaterThanOrEqual(90);
  });

  it("identifies a falling pitch pattern when final semitones drop", () => {
    const fallingPoints: PitchPoint[] = [
      { timeMs: 0, pitchHz: 200, semitones: 3.0, confidence: 0.9 },
      { timeMs: 200, pitchHz: 180, semitones: 1.5, confidence: 0.9 },
      { timeMs: 400, pitchHz: 150, semitones: 0.0, confidence: 0.9 },
      { timeMs: 600, pitchHz: 130, semitones: -3.0, confidence: 0.9 },
    ];

    const result = evaluateIntonationContour(fallingPoints, "falling");
    expect(result.matched).toBe(true);
    expect(result.userPattern).toBe("falling");
    expect(result.scorePct).toBeGreaterThanOrEqual(90);
  });

  it("flags mismatch when user falls on a rising question", () => {
    const fallingPoints: PitchPoint[] = [
      { timeMs: 0, pitchHz: 200, semitones: 2.0, confidence: 0.9 },
      { timeMs: 200, pitchHz: 160, semitones: 0.0, confidence: 0.9 },
      { timeMs: 400, pitchHz: 130, semitones: -3.0, confidence: 0.9 },
      { timeMs: 600, pitchHz: 120, semitones: -4.0, confidence: 0.9 },
    ];

    const result = evaluateIntonationContour(fallingPoints, "rising");
    expect(result.matched).toBe(false);
    expect(result.userPattern).toBe("falling");
  });
});
