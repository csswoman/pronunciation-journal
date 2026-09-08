import { describe, it, expect } from "vitest";
import { pcmToWav, parseSampleRateFromMime } from "../audio";

describe("lib/gemini/audio", () => {
  describe("pcmToWav", () => {
    it("prepends a valid 44-byte RIFF/WAVE header", () => {
      const dummyPcm = Buffer.alloc(100, 0x12);
      const wav = pcmToWav(dummyPcm, 24000, 1, 16);

      expect(wav.length).toBe(44 + 100);
      expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
      expect(wav.readUInt32LE(4)).toBe(36 + 100);
      expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
      expect(wav.toString("ascii", 12, 16)).toBe("fmt ");
      expect(wav.readUInt32LE(16)).toBe(16); // subchunk1 size
      expect(wav.readUInt16LE(20)).toBe(1); // PCM format
      expect(wav.readUInt16LE(22)).toBe(1); // 1 channel
      expect(wav.readUInt32LE(24)).toBe(24000); // sample rate
      expect(wav.readUInt32LE(28)).toBe((24000 * 1 * 16) / 8); // byte rate
      expect(wav.readUInt16LE(32)).toBe(2); // block align
      expect(wav.readUInt16LE(34)).toBe(16); // bits per sample
      expect(wav.toString("ascii", 36, 40)).toBe("data");
      expect(wav.readUInt32LE(40)).toBe(100); // data size
      // payload matches
      expect(wav.subarray(44)).toEqual(dummyPcm);
    });
  });

  describe("parseSampleRateFromMime", () => {
    it("extracts sample rate from mimeType with rate parameter", () => {
      expect(parseSampleRateFromMime("audio/pcm;rate=24000")).toBe(24000);
      expect(parseSampleRateFromMime("audio/L16;rate=16000")).toBe(16000);
      expect(parseSampleRateFromMime("audio/pcm; rate=48000")).toBe(48000);
    });

    it("falls back when no rate is present or invalid", () => {
      expect(parseSampleRateFromMime("audio/pcm")).toBe(24000);
      expect(parseSampleRateFromMime(undefined)).toBe(24000);
      expect(parseSampleRateFromMime("audio/pcm;rate=invalid", 22050)).toBe(22050);
    });
  });
});
