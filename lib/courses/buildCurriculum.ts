import type {
  CoursePathLesson,
  CoursePathLevel,
  CoursePathUnit,
  ElectiveSpineIcon,
  LessonPriority,
} from "./types";

export interface PlatziCourseInput {
  t: string;
  p: LessonPriority;
  s?: boolean;
  /** Stable grammar-deck slug → `public/grammar-decks/<g>.json`. Independent of `number`. */
  g?: string;
}

function toLesson(
  levelId: CoursePathLevel["id"],
  course: PlatziCourseInput,
  number: number
): CoursePathLesson {
  const numStr = String(number);
  return {
    id: numStr,
    number,
    title: course.t,
    slug: course.g,
    priority: course.p,
    isOptional: course.p === 0,
    soundLab: course.s,
  };
}

function mapLessons(
  levelId: CoursePathLevel["id"],
  prefix: string,
  courses: PlatziCourseInput[],
  startNumber: number
): { lessons: CoursePathLesson[]; nextNumber: number } {
  let n = startNumber;
  const lessons = courses.map((c) => toLesson(levelId, c, ++n));
  return { lessons, nextNumber: n };
}

export function buildLevelFromPlatzi(
  id: CoursePathLevel["id"],
  spineLabel: string,
  spineSubtitle: string,
  title: string,
  hours: string,
  courses: PlatziCourseInput[],
  opts?: { isElective?: boolean; spineIcon?: ElectiveSpineIcon }
): CoursePathLevel {
  const core = courses.filter((c) => c.p > 0);
  const optional = courses.filter((c) => c.p === 0);
  const units: CoursePathUnit[] = [];
  let lessonNumber = 0;

  if (core.length > 0) {
    const { lessons, nextNumber } = mapLessons(id, `${id}-core`, core, lessonNumber);
    lessonNumber = nextNumber;
    units.push({
      id: `${id}-core`,
      label: opts?.isElective ? "Prioritarios" : "Ruta prioritaria",
      title: `${core.length} curso${core.length === 1 ? "" : "s"} prioritario${core.length === 1 ? "" : "s"}`,
      lessons,
    });
  }

  if (optional.length > 0) {
    const { lessons } = mapLessons(id, `${id}-opt`, optional, lessonNumber);
    units.push({
      id: `${id}-optional`,
      label: "Opcional",
      title: "Currículo amplio · para después",
      lessons,
      isOptionalSection: true,
    });
  }

  return {
    id,
    spineLabel,
    spineSubtitle,
    title,
    hours,
    units,
    isElective: opts?.isElective,
    spineIcon: opts?.spineIcon,
  };
}

export function countPriorityLessons(level: CoursePathLevel): number {
  return level.units
    .filter((u) => !u.isOptionalSection)
    .flatMap((u) => u.lessons)
    .length;
}
