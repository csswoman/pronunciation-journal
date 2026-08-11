import type {
  CoursePathLesson,
  CoursePathLevel,
  CoursePathUnit,
  ElectiveSpineIcon,
  LessonPriority,
} from "./types";
import type { PronunciationTargetId } from "@/lib/pronunciation/targets/types";
import { theoryTopicForDeck } from "@/lib/learning-loop/theory-targets";

export interface CourseInput {
  t: string;
  p: LessonPriority;
  s?: boolean;
  /** Stable grammar-deck slug → `public/grammar-decks/<g>.json`. Independent of `number`. */
  g?: string;
  /** Authored pronunciation targets this lesson teaches. Never inferred from `t`/`s`. */
  pt?: PronunciationTargetId[];
}

function toLesson(
  levelId: CoursePathLevel["id"],
  course: CourseInput,
  number: number
): CoursePathLesson {
  const numStr = String(number);
  return {
    id: numStr,
    number,
    title: course.t,
    slug: course.g,
    topicId: course.g ? theoryTopicForDeck(course.g) : undefined,
    priority: course.p,
    isOptional: course.p === 0,
    soundLab: course.s,
    pronunciationTargetIds: course.pt,
  };
}

function mapLessons(
  levelId: CoursePathLevel["id"],
  prefix: string,
  courses: CourseInput[],
  startNumber: number
): { lessons: CoursePathLesson[]; nextNumber: number } {
  let n = startNumber;
  const lessons = courses.map((c) => toLesson(levelId, c, ++n));
  return { lessons, nextNumber: n };
}

export function buildLevel(
  id: CoursePathLevel["id"],
  spineLabel: string,
  spineSubtitle: string,
  title: string,
  hours: string,
  courses: CourseInput[],
  opts?: {
    isElective?: boolean;
    spineIcon?: ElectiveSpineIcon;
    optionalLabel?: string;
    optionalTitle?: string;
  }
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
      label: opts?.isElective ? "Recomendados" : "Lo esencial",
      title: `${core.length === 1 ? "1 lección" : `${core.length} lecciones`} clave`,
      lessons,
    });
  }

  if (optional.length > 0) {
    const { lessons } = mapLessons(id, `${id}-opt`, optional, lessonNumber);
    units.push({
      id: `${id}-optional`,
      label: opts?.optionalLabel ?? "Opcional",
      title: opts?.optionalTitle ?? "Lecciones para profundizar",
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
