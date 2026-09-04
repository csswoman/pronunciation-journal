import { COURSE_PATH_CURRICULUM } from "./curriculum";
import type { CefrLevelId, CoursePathLesson, CoursePathLevel, CoursePathTrackId } from "./types";
import { STANDALONE_DECK_TITLES } from "./grammar-deck/standalone-titles";

const ALL_LEVELS: CoursePathLevel[] = [
  ...COURSE_PATH_CURRICULUM.levels,
  ...COURSE_PATH_CURRICULUM.electiveTracks,
];

export function parseCoursePathTrackId(value: string | undefined): CoursePathTrackId | null {
  if (
    value === "a1" ||
    value === "a2" ||
    value === "b1" ||
    value === "b2" ||
    value === "c1" ||
    value === "purposes" ||
    value === "business" ||
    value === "connected-speech" ||
    value === "chunks" ||
    value === "false-friends"
  ) {
    return value;
  }
  return null;
}

export function parseCefrLevelId(value: string | undefined): CefrLevelId | null {
  if (value === "a1" || value === "a2" || value === "b1" || value === "b2" || value === "c1") {
    return value;
  }
  return null;
}

export function getLevelById(trackId: CoursePathTrackId): CoursePathLevel | undefined {
  return ALL_LEVELS.find((l) => l.id === trackId);
}

export function getLessonByNumber(
  trackId: CoursePathTrackId,
  lessonNumber: number
): CoursePathLesson | undefined {
  const level = getLevelById(trackId);
  if (!level || lessonNumber < 1) return undefined;

  for (const unit of level.units) {
    const lesson = unit.lessons.find((l) => l.number === lessonNumber);
    if (lesson) return lesson;
  }
  return undefined;
}

export function studyLessonPath(trackId: CoursePathTrackId, lessonNumber: number): string {
  return `/courses/study/${lessonNumber}?level=${trackId}`;
}

export function getLessonBySlug(slug: string): CoursePathLesson | undefined {
  for (const level of ALL_LEVELS) {
    for (const unit of level.units) {
      const lesson = unit.lessons.find((l) => l.slug === slug);
      if (lesson) return lesson;
    }
  }
  return undefined;
}

/** First Route lesson that uses this deck slug (track + number for study URLs). */
export function findStudyByDeckSlug(
  deckSlug: string
): { trackId: CoursePathTrackId; lesson: CoursePathLesson } | undefined {
  for (const level of ALL_LEVELS) {
    for (const unit of level.units) {
      const lesson = unit.lessons.find((l) => l.slug === deckSlug);
      if (lesson) return { trackId: level.id, lesson };
    }
  }
  return undefined;
}

/**
 * Prefer the Route study URL when the deck is on a path; otherwise open the
 * standalone practice deck viewer.
 */
export function studyOrPracticeDeckHref(deckSlug: string): string {
  const found = findStudyByDeckSlug(deckSlug);
  if (found) return studyLessonPath(found.trackId, found.lesson.number);
  return `/practice/decks/${deckSlug}`;
}

/**
 * Checks if a slug belongs to an authored grammar or chunk deck.
 */
export function isGrammarDeckSlug(slug: string): boolean {
  return (
    slug.startsWith("a1-") ||
    slug.startsWith("a2-") ||
    slug.startsWith("b1-") ||
    slug.startsWith("b2-") ||
    slug.startsWith("c1-") ||
    slug.startsWith("c2-") ||
    slug.startsWith("biz-") ||
    slug.startsWith("tech-") ||
    slug.startsWith("cs-") ||
    slug.startsWith("chunk-") ||
    slug.startsWith("chunks-") ||
    slug.startsWith("ff-") ||
    Boolean(STANDALONE_DECK_TITLES[slug])
  );
}

/**
 * Resolves the destination URL for a saved lesson or deck.
 * Checks payload.href first, then checks if the slug belongs to a course lesson
 * (/courses/study/:n?level=:trackId), then checks if it's a grammar/chunk deck
 * (/practice/decks/:slug), falling back to /mini-lessons/:slug.
 */
export function resolveLessonHref(ref: string, payload?: Record<string, unknown>): string {
  if (typeof payload?.href === "string" && payload.href.trim()) {
    return payload.href.trim();
  }
  const study = findStudyByDeckSlug(ref);
  if (study) {
    return studyLessonPath(study.trackId, study.lesson.number);
  }
  if (isGrammarDeckSlug(ref)) {
    return `/practice/decks/${ref}`;
  }
  return `/mini-lessons/${ref}`;
}

/**
 * Resolves the canonical full title for a lesson or deck reference.
 * Prevents truncated titles (e.g. when titleEmphasis was missing upon save).
 */
export function resolveLessonTitle(ref: string, currentTitle?: string | null): string {
  const study = findStudyByDeckSlug(ref);
  if (study?.lesson.title) return study.lesson.title;
  if (STANDALONE_DECK_TITLES[ref]) return STANDALONE_DECK_TITLES[ref];
  return (currentTitle && currentTitle.trim()) || ref;
}


