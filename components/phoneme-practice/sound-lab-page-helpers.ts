import type { SoundLabChip } from "./SoundLabFilterRow";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { getCanonicalSound } from "@/lib/sounds/inventory";

export const ALL_GROUP_SECTIONS = [
  { id: "vowel", title: "Vocales" },
  { id: "diphthong", title: "Diptongos" },
  { id: "consonant", title: "Consonantes" },
] as const;

export function getLessonSectionId(lesson: Lesson): string {
  return getCanonicalSound(ipaFromLessonTitle(lesson.title) ?? "")?.type ?? "consonant";
}

export function matchesDifficultyChip(lesson: Lesson, chip: SoundLabChip): boolean {
  if (chip === "all") return true;
  return lesson.difficulty === chip;
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
