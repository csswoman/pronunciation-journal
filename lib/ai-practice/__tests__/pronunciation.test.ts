import { describe, it, expect } from "vitest";
import { pickUSPhonetic, stripIPASlashes } from "../modes/pronunciation";

describe("pickUSPhonetic", () => {
  it("returns null for empty array", () => {
    expect(pickUSPhonetic([])).toBeNull();
  });

  it("returns null when no phonetic has text", () => {
    expect(pickUSPhonetic([{ audio: "word-us.mp3" }])).toBeNull();
  });

  it("prefers US audio over others", () => {
    const phonetics = [
      { text: "/wɜːld/", audio: "word-uk.mp3" },
      { text: "/wɜːrld/", audio: "word-us.mp3" },
    ];
    expect(pickUSPhonetic(phonetics)).toBe("/wɜːrld/");
  });

  it("avoids UK when no explicit US exists", () => {
    const phonetics = [
      { text: "/wɜːld/", audio: "word-uk.mp3" },
      { text: "/wɜːrld/", audio: "word-au.mp3" },
    ];
    expect(pickUSPhonetic(phonetics)).toBe("/wɜːrld/");
  });

  it("falls back to any entry with text when all are UK", () => {
    const phonetics = [
      { text: "/wɜːld/", audio: "word-uk.mp3" },
    ];
    expect(pickUSPhonetic(phonetics)).toBe("/wɜːld/");
  });

  it("picks US even when it is not first in the array", () => {
    const phonetics = [
      { text: "/θɪŋk/", audio: "think-au.mp3" },
      { text: "/θɪŋk/", audio: "think-uk.mp3" },
      { text: "/θɪŋk/", audio: "think-us.mp3" },
    ];
    expect(pickUSPhonetic(phonetics)).toBe("/θɪŋk/");
  });

  it("ignores entries without text even if they have US audio", () => {
    const phonetics = [
      { audio: "word-us.mp3" },               // no text
      { text: "/wɜːld/", audio: "word-uk.mp3" },
    ];
    // no US with text → avoids UK → falls back to UK (only option)
    expect(pickUSPhonetic(phonetics)).toBe("/wɜːld/");
  });

  it("handles phonetics with text but no audio", () => {
    const phonetics = [{ text: "/hɛloʊ/" }];
    expect(pickUSPhonetic(phonetics)).toBe("/hɛloʊ/");
  });
});

describe("stripIPASlashes", () => {
  it("removes leading and trailing slashes", () => {
    expect(stripIPASlashes("/hɛloʊ/")).toBe("hɛloʊ");
  });

  it("removes only leading slash when trailing is absent", () => {
    expect(stripIPASlashes("/hɛloʊ")).toBe("hɛloʊ");
  });

  it("removes only trailing slash when leading is absent", () => {
    expect(stripIPASlashes("hɛloʊ/")).toBe("hɛloʊ");
  });

  it("is a no-op when no slashes", () => {
    expect(stripIPASlashes("hɛloʊ")).toBe("hɛloʊ");
  });
});
