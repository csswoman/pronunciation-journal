import { describe, expect, it } from "vitest";
import { deriveSkillStatus, getLearningReason } from "../skill-item";
import type { ItemSchedule, LearningItem } from "../verification/types";

const item = (schedule: ItemSchedule): LearningItem => ({
  id: "c1k:on#meaning",
  wordId: "c1k:on",
  skill: "meaning",
  contentOrigin: "authored",
  schedule,
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

const fsrs = (state: "New" | "Learning" | "Review" | "Relearning"): ItemSchedule => ({
  kind: "fsrs",
  dueAt: "2026-08-20T00:00:00.000Z",
  stability: 10,
  difficulty: 5,
  state,
});

describe("deriveSkillStatus", () => {
  it("sin programación es unseen", () => {
    expect(deriveSkillStatus(item({ kind: "none" }))).toBe("unseen");
  });

  it("provisional es provisional", () => {
    expect(deriveSkillStatus(item({
      kind: "provisional",
      dueAt: "2026-08-20T00:00:00.000Z",
      source: "direct",
      evidenceConfidence: 1,
    }))).toBe("provisional");
  });

  it("FSRS en Review es review", () => {
    expect(deriveSkillStatus(item(fsrs("Review")))).toBe("review");
  });

  it("FSRS en Learning y Relearning es learning (invariante 21)", () => {
    expect(deriveSkillStatus(item(fsrs("Learning")))).toBe("learning");
    expect(deriveSkillStatus(item(fsrs("Relearning")))).toBe("learning");
  });

  it("FSRS en New es learning, no unseen", () => {
    expect(deriveSkillStatus(item(fsrs("New")))).toBe("learning");
  });
});

describe("getLearningReason", () => {
  it("es undefined si el ítem no está en learning", () => {
    expect(getLearningReason(item({ kind: "none" }))).toBeUndefined();
    expect(getLearningReason(item(fsrs("Review")))).toBeUndefined();
  });

  it("Relearning da lapse (invariante 21)", () => {
    expect(getLearningReason(item(fsrs("Relearning")))).toBe("lapse");
  });

  it("Learning da new", () => {
    expect(getLearningReason(item(fsrs("Learning")))).toBe("new");
  });

  it("la razón se deriva solo de FsrsCardState (invariante 20)", () => {
    const relearning = item(fsrs("Relearning"));
    const learning = item(fsrs("Learning"));
    expect(getLearningReason(relearning)).not.toBe(getLearningReason(learning));
  });
});
