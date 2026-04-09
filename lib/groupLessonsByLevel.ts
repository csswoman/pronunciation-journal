export const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"] as const;

export type LessonLevel = (typeof LEVEL_ORDER)[number];

export type LessonListItem = {
  id: string;
  title: string;
  content: string | null;
  level: string | null;
  category: string | null;
  is_system: boolean;
  created_by: string | null;
  image_url?: string | null;
  slug?: string | null;
};

type GroupedLessons = Record<LessonLevel, LessonListItem[]>;

export function groupLessonsByLevel(lessons: LessonListItem[]): GroupedLessons {
  const grouped: GroupedLessons = {
    A1: [],
    A2: [],
    B1: [],
    B2: [],
    C1: [],
  };

  for (const lesson of lessons) {
    const normalizedLevel = lesson.level?.toUpperCase() as LessonLevel | undefined;
    if (!normalizedLevel || !(normalizedLevel in grouped)) {
      continue;
    }
    grouped[normalizedLevel].push(lesson);
  }

  return grouped;
}
