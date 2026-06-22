import { describe, expect, it } from "vitest";
import {
  buildAssessment,
  COURSE_PATH_CURRICULUM,
  LEVEL_ASSESSMENT_CONTRACTS,
} from "../curriculum";
import type { CefrLevelId } from "../types";

function essentialSlugs(level: CefrLevelId): string[] {
  const entry = COURSE_PATH_CURRICULUM.levels.find((item) => item.id === level);
  return entry?.units
    .filter((unit) => !unit.isOptionalSection)
    .flatMap((unit) => unit.lessons.map((lesson) => lesson.slug).filter(Boolean) as string[]) ?? [];
}

describe("course curriculum coverage", () => {
  it.each(["a1", "a2", "b1", "b2", "c1"] as CefrLevelId[])(
    "keeps required %s assessment topics in the essential curriculum",
    (level) => {
      expect(essentialSlugs(level)).toEqual(
        expect.arrayContaining(LEVEL_ASSESSMENT_CONTRACTS[level].requiredLessonSlugs),
      );
    },
  );

  it("builds placement sections in CEFR order without writing items", () => {
    const assessment = buildAssessment("placement");

    expect(assessment.map((section) => section.level)).toEqual(["a1", "a2", "b1", "b2", "c1"]);
    expect(assessment.every((section) => section.items.length === 6)).toBe(true);
    expect(assessment.flatMap((section) => section.items).every(
      (item) => item.questionType !== ("writing" as never),
    )).toBe(true);
  });

  it("builds a checkpoint with deterministic fallback and threshold", () => {
    expect(buildAssessment("checkpoint", "b1")).toEqual([
      expect.objectContaining({ level: "b1", passThreshold: 5, fallbackLevel: "a2" }),
    ]);
  });
});
