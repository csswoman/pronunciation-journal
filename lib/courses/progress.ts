import type {
  CoursePathLevel,
  CoursePathLesson,
  CoursePathUnit,
  CoursePathTrackId,
  LessonProgressState,
  UnitProgressState,
} from "./types";

export function lessonProgressKey(levelId: CoursePathTrackId, lessonId: string): string {
  return `${levelId}:${lessonId}`;
}

export function getCoreUnits(level: CoursePathLevel): CoursePathUnit[] {
  return level.units.filter((u) => !u.isOptionalSection);
}

export function getCoreLessons(level: CoursePathLevel): CoursePathLesson[] {
  return getCoreUnits(level).flatMap((u) => u.lessons);
}

export function flattenLessons(level: CoursePathLevel): CoursePathLesson[] {
  return level.units.flatMap((u) => u.lessons);
}

export interface DerivedUnitView {
  unit: CoursePathUnit;
  status: UnitProgressState;
  progressPercent: number;
  lessons: Array<CoursePathLesson & { state: LessonProgressState }>;
  defaultOpen: boolean;
}

export interface DerivedLevelView {
  level: CoursePathLevel;
  progressPercent: number;
  completedCoreLessons: number;
  totalCoreLessons: number;
  completedUnits: number;
  units: DerivedUnitView[];
}

function unitIsDone(
  unit: CoursePathUnit,
  completedLessonIds: Set<string>,
  levelId: CoursePathTrackId
): boolean {
  return unit.lessons.every((l) => completedLessonIds.has(lessonProgressKey(levelId, l.id)));
}

export function deriveLevelView(
  level: CoursePathLevel,
  completedLessonIds: Set<string>
): DerivedLevelView {
  const coreLessons = getCoreLessons(level);
  const lessonState = new Map<string, LessonProgressState>();
  let assignedCurrent = false;

  // No sequential locking: completed lessons are "done", the first pending
  // core lesson is the "current" focus, and everything else is freely
  // "available" so any lesson can be opened at will.
  for (const lesson of coreLessons) {
    const key = lessonProgressKey(level.id, lesson.id);
    if (completedLessonIds.has(key)) {
      lessonState.set(lesson.id, "done");
    } else if (!assignedCurrent) {
      lessonState.set(lesson.id, "current");
      assignedCurrent = true;
    } else {
      lessonState.set(lesson.id, "available");
    }
  }

  const units: DerivedUnitView[] = level.units.map((unit) => {
    const lessons = unit.lessons.map((lesson) => {
      if (unit.isOptionalSection) {
        if (completedLessonIds.has(lessonProgressKey(level.id, lesson.id))) {
          return { ...lesson, state: "done" as const };
        }
        return { ...lesson, state: "available" as const };
      }
      return {
        ...lesson,
        state: lessonState.get(lesson.id) ?? "available",
      };
    });

    const doneCount = lessons.filter((l) => l.state === "done").length;
    const progressPercent =
      unit.lessons.length === 0 ? 0 : Math.round((doneCount / unit.lessons.length) * 100);

    const allDone = unitIsDone(unit, completedLessonIds, level.id);
    const status: UnitProgressState = allDone ? "done" : "active";

    return {
      unit,
      status,
      progressPercent,
      lessons,
      // Core units open by default; the broad optional list stays collapsed.
      defaultOpen: status === "active" && !unit.isOptionalSection,
    };
  });

  const totalCoreLessons = coreLessons.length;
  const completedCoreLessons = coreLessons.filter((l) =>
    completedLessonIds.has(lessonProgressKey(level.id, l.id))
  ).length;
  const progressPercent =
    totalCoreLessons === 0
      ? 0
      : Math.round((completedCoreLessons / totalCoreLessons) * 100);
  const completedUnits = units.filter((u) => u.status === "done").length;

  return {
    level,
    progressPercent,
    completedCoreLessons,
    totalCoreLessons,
    completedUnits,
    units,
  };
}
