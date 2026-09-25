import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { choosePracticeRotation, nextPracticeRotation } from "../practice-rotation";

describe("practice rotation", () => {
  it("uses three different angles across consecutive requests", () => {
    const first = choosePracticeRotation([]);
    const second = choosePracticeRotation([first.angle]);
    const third = choosePracticeRotation([first.angle, second.angle]);
    expect(new Set([first.angle, second.angle, third.angle])).toHaveLength(3);
  });

  it("preserves the 2-2-1 format distribution", () => {
    const { formats } = choosePracticeRotation([]);
    expect(formats.filter((format) => format === "multiple-choice")).toHaveLength(2);
    expect(formats.filter((format) => format === "fill-blank")).toHaveLength(2);
    expect(formats.filter((format) => format === "speaking")).toHaveLength(1);
  });

  it("persists recent angles per account", async () => {
    const userId = "practice-rotation-test";
    const rotations = [
      await nextPracticeRotation(userId),
      await nextPracticeRotation(userId),
      await nextPracticeRotation(userId),
    ];
    expect(new Set(rotations.map(({ angle }) => angle))).toHaveLength(3);
    await db.practicePrefs.delete(`coach-practice-rotation:${userId}`);
  });
});
