import { COURSE_PATH_CURRICULUM } from "./curriculum";
import type { CoursePathLesson, CoursePathLevel, CoursePathTrackId } from "./types";

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
    value === "business"
  ) {
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
