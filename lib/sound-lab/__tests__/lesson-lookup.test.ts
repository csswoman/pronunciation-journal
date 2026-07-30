import { describe, expect, it } from "vitest";
import { practiceHrefForIpa } from "../lesson-lookup";
import type { Lesson } from "@/lib/types";

function lesson(overrides: Partial<Lesson> & { title: string }): Lesson {
  return {
    id: "1",
    description: "",
    difficulty: 1,
    words: [],
    ...overrides,
  } as Lesson;
}

describe("practiceHrefForIpa", () => {
  it("finds the href of the lesson teaching the given IPA", () => {
    const lessons = [
      lesson({ title: "/iː/ — ship vs sheep", href: "/practice/sounds/sound/1" }),
      lesson({ title: "/ɑ/ — hot", href: "/practice/sounds/sound/2" }),
    ];
    expect(practiceHrefForIpa(lessons, "/ɑ/")).toBe("/practice/sounds/sound/2");
  });

  it("returns null when no lesson teaches that sound", () => {
    const lessons = [lesson({ title: "/ɑ/ — hot", href: "/practice/sounds/sound/2" })];
    expect(practiceHrefForIpa(lessons, "/θ/")).toBeNull();
  });

  it("returns null when the matching lesson has no href", () => {
    const lessons = [lesson({ title: "/ɑ/ — hot" })];
    expect(practiceHrefForIpa(lessons, "/ɑ/")).toBeNull();
  });
});
