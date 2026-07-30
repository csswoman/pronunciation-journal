import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "./display";

/** Practice href for the first lesson teaching `ipa` (canonical, slash-wrapped), or null. */
export function practiceHrefForIpa(lessons: Lesson[], ipa: string): string | null {
  const lesson = lessons.find((l) => ipaFromLessonTitle(l.title) === ipa);
  return lesson?.href ?? null;
}
