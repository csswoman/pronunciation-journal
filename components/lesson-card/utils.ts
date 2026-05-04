import type { LessonListItem } from "@/lib/groupLessonsByLevel";

export function toLabel(value: string | null): string {
  if (!value) return "General";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getLessonHref(lesson: LessonListItem): string {
  return lesson.slug ? `/courses` : `/lesson/${lesson.id}`;
}
