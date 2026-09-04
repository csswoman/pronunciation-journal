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

  it("keeps C1+ as an advanced band inside the C1 contract", () => {
    const c1 = COURSE_PATH_CURRICULUM.levels.find((level) => level.id === "c1");
    const core = c1?.units.find((unit) => !unit.isOptionalSection);
    const advanced = c1?.units.find((unit) => unit.isOptionalSection);

    expect(core?.lessons).toHaveLength(28);
    expect(advanced).toMatchObject({
      label: "C1+",
      title: "Dominio avanzado",
    });
    expect(advanced?.lessons.length).toBeGreaterThanOrEqual(20);
  });

  it("resolves correct URLs for course lessons and mini-lessons using resolveLessonHref", async () => {
    const { resolveLessonHref } = await import("../curriculumIndex");

    // Course lesson slug
    expect(resolveLessonHref("a2-descripciones-comparaciones")).toBe("/courses/study/10?level=a2");

    // Explicit payload href override
    expect(resolveLessonHref("a2-descripciones-comparaciones", { href: "/courses/study/10?level=a2&custom=1" })).toBe(
      "/courses/study/10?level=a2&custom=1",
    );

    // Standalone practice deck slug
    expect(resolveLessonHref("chunk-standalone-deck")).toBe("/practice/decks/chunk-standalone-deck");

    // Fallback mini-lesson slug
    expect(resolveLessonHref("standalone-mini-lesson")).toBe("/mini-lessons/standalone-mini-lesson");
  });

  it("resolves canonical titles for lessons and decks using resolveLessonTitle", async () => {
    const { resolveLessonTitle } = await import("../curriculumIndex");

    // Standalone deck with truncated saved title is restored to canonical full title
    expect(resolveLessonTitle("chunk-speaking-frameworks", "Frameworks para")).toBe(
      "Frameworks para hablar sin traducir",
    );

    // Course lesson title
    expect(resolveLessonTitle("a2-descripciones-comparaciones")).toBe("Describir y comparar");

    // Unknown reference falls back to provided title or ref
    expect(resolveLessonTitle("custom-ref", "My Custom Title")).toBe("My Custom Title");
    expect(resolveLessonTitle("custom-ref")).toBe("custom-ref");
  });
});

