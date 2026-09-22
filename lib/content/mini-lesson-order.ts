import type { MiniLesson } from "./schemas";
import type { CefrLevelId } from "@/lib/courses/types";
import { equivalentDeckSlugForMiniLesson } from "@/lib/learning-loop/theory-targets";

const CEFR_LEVEL_IDS: readonly CefrLevelId[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

/**
 * CEFR level for a mini-lesson, derived from its equivalent deck slug's
 * prefix (authored in MINI_LESSON_EQUIVALENT_DECKS). Pure (no `fs`), so it
 * is safe to import from Client Components — unlike lib/content/lessons.ts.
 */
export function miniLessonCefrLevel(slug: string): CefrLevelId | null {
  const deckSlug = equivalentDeckSlugForMiniLesson(slug);
  if (!deckSlug) return null;
  const prefix = deckSlug.split("-")[0];
  return (CEFR_LEVEL_IDS as readonly string[]).includes(prefix) ? (prefix as CefrLevelId) : null;
}

export interface MiniLessonLevelGroups {
  /** Lessons at the learner's level or one step away, in level order. */
  forYourLevel: MiniLesson[];
  /** Every other lesson with a CEFR level, grouped and ordered by level. */
  byLevel: Array<{ level: CefrLevelId; lessons: MiniLesson[] }>;
  /** Lessons with no CEFR equivalence (connected speech, general). */
  general: MiniLesson[];
}

/**
 * Splits mini-lessons into a "for your level" band (learner level ±1) and
 * the rest grouped by CEFR level, with level-less lessons last. Nothing is
 * hidden — every lesson still appears in `byLevel` or `general`.
 */
export function groupMiniLessonsByLearnerLevel(
  lessons: MiniLesson[],
  learnerLevel: CefrLevelId | null,
): MiniLessonLevelGroups {
  const withLevel = lessons.map((lesson) => ({
    lesson,
    level: miniLessonCefrLevel(lesson.slug),
  }));

  const learnerIndex = learnerLevel ? CEFR_LEVEL_IDS.indexOf(learnerLevel) : -1;
  const nearbyLevels = new Set<CefrLevelId>(
    learnerIndex < 0
      ? []
      : CEFR_LEVEL_IDS.filter((_, i) => Math.abs(i - learnerIndex) <= 1),
  );

  const forYourLevel = withLevel
    .filter((e) => e.level && nearbyLevels.has(e.level))
    .map((e) => e.lesson);

  const byLevel = CEFR_LEVEL_IDS.map((level) => ({
    level,
    lessons: withLevel.filter((e) => e.level === level).map((e) => e.lesson),
  })).filter((group) => group.lessons.length > 0);

  const general = withLevel.filter((e) => !e.level).map((e) => e.lesson);

  return { forYourLevel, byLevel, general };
}
