import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { getCanonicalSound } from "@/lib/sounds/inventory";
import { MASTERY_DISPLAY_THRESHOLD } from "@/lib/phoneme-practice/mastery-pct";
import { getSpanishContrast, type SpanishContrastLevel } from "@/lib/sounds/spanish-contrast";

export const ALL_GROUP_SECTIONS = [
  { id: "vowel", title: "Vocales" },
  { id: "diphthong", title: "Diptongos" },
  { id: "consonant", title: "Consonantes" },
] as const;

export function getLessonSectionId(lesson: Lesson): string {
  return getCanonicalSound(ipaFromLessonTitle(lesson.title) ?? "")?.type ?? "consonant";
}

export type SoundLabProgressFilter = "all" | "review" | "unpracticed" | "mastered";
export type SoundLabContrastFilter = "all" | SpanishContrastLevel;

export function matchesProgressFilter(
  lesson: Lesson,
  filter: SoundLabProgressFilter,
  soundProgressMap: Map<string, number>,
): boolean {
  if (filter === "all") return true;
  const ipa = ipaFromLessonTitle(lesson.title);
  const progressPct = ipa ? soundProgressMap.get(ipa) : undefined;

  if (filter === "unpracticed") {
    return progressPct === undefined || progressPct === 0;
  }
  if (filter === "review") {
    return progressPct !== undefined && progressPct > 0 && progressPct < 60;
  }
  if (filter === "mastered") {
    return progressPct !== undefined && progressPct >= MASTERY_DISPLAY_THRESHOLD;
  }
  return true;
}

export function matchesContrastFilter(
  lesson: Lesson,
  filter: SoundLabContrastFilter,
): boolean {
  if (filter === "all") return true;
  const ipa = ipaFromLessonTitle(lesson.title);
  if (!ipa) return false;
  const info = getSpanishContrast(ipa);
  return info.level === filter;
}

export function matchesHardFilter(lesson: Lesson): boolean {
  const ipa = ipaFromLessonTitle(lesson.title);
  if (!ipa) return false;
  const info = getSpanishContrast(ipa);
  return info.level === "missing" || info.level === "confusable" || lesson.difficulty === "hard";
}

export function resolveGroupId(lesson: Lesson): string {
  return getLessonSectionId(lesson);
}

export function headerStatsLine(inProgressCount: number, totalCount: number): string {
  if (inProgressCount > 0) {
    return `${inProgressCount} de ${totalCount} sonidos en curso`;
  }
  if (totalCount === 1) {
    return "1 sonido listo para practicar";
  }
  return `${totalCount} sonidos listos para practicar`;
}

export function continueCtaLabel(lesson: Lesson | null): string {
  const ipa = lesson ? ipaFromLessonTitle(lesson.title) : null;
  if (ipa) return `Continuar ${ipa}`;
  return "Continuar lección";
}

/** True when a lesson teaches any of the focused IPA symbols (from a course handoff). */
export function matchesFocus(lesson: Lesson, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const title = lesson.title.toLowerCase();
  return tokens.some((t) => {
    const tok = t.toLowerCase();
    if (title.includes(tok)) return true;
    return lesson.words?.some((w) => w.ipa?.toLowerCase().includes(tok)) ?? false;
  });
}

export function lessonMatchesSearch(lesson: Lesson, q: string): boolean {
  if (!q) return true;
  if (lesson.title.toLowerCase().includes(q)) return true;
  if (lesson.description.toLowerCase().includes(q)) return true;
  const ipa = lesson.title.match(/^\/+([^/]+)\/+/)?.[1]?.toLowerCase();
  if (ipa && ipa.includes(q.replaceAll("/", ""))) return true;
  return (
    lesson.words?.some((w) => {
      if (w.word?.toLowerCase().includes(q)) return true;
      if (w.ipa?.toLowerCase().includes(q)) return true;
      return false;
    }) ?? false
  );
}
