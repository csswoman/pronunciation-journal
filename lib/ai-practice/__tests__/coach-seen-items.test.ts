import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getRecentCoachStems, normalizeCoachStem, stemFromToolCall } from "../coach-seen-items";
import { db } from "@/lib/db";

describe("coach seen items", () => {
  it("normalizes and bounds stems", () => {
    expect(normalizeCoachStem("  Where   DID you go?  ")).toBe("where did you go?");
    expect(normalizeCoachStem("A".repeat(100))).toHaveLength(80);
  });

  it("extracts exercise stems and ignores non-exercise tools", () => {
    expect(stemFromToolCall({
      id: "one", name: "render_multiple_choice",
      args: { question: "Choose the answer" }, status: "rendered",
    })).toBe("choose the answer");
    expect(stemFromToolCall({
      id: "two", name: "save_word", args: { word: "hello" }, status: "rendered",
    })).toBeNull();
  });

  it("returns only the 20 most recently seen stems for the account", async () => {
    const userId = "coach-seen-test";
    await db.coachSeenItems.bulkPut(Array.from({ length: 22 }, (_, index) => ({
      id: `${userId}:${index}`,
      userId,
      topic: "past_simple",
      stem: `stem ${index}`,
      seenAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    })));
    const stems = await getRecentCoachStems(userId);
    expect(stems).toHaveLength(20);
    expect(stems[0]).toBe("stem 21");
    expect(stems).not.toContain("stem 0");
    await db.coachSeenItems.where("userId").equals(userId).delete();
  });
});
