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

export const CONTRAST_GROUP_SECTIONS = [
  {
    id: "missing",
    title: "Sonidos que no existen en español",
    subtitle: "Estos suelen costar más a hispanohablantes — practica primero.",
  },
  {
    id: "confusable",
    title: "Se confunden fácil",
    subtitle: "Pares mínimos y contrastes donde un cambio de sonido altera el significado.",
  },
  {
    id: "similar",
    title: "Similares al español",
    subtitle: "Fonemas con alta transferencia positiva. Ya conoces la base articulatoria.",
  },
] as const;

export type SoundLabGrouping = "impact" | "type";

export function getLessonSectionId(lesson: Lesson): string {
  return getCanonicalSound(ipaFromLessonTitle(lesson.title) ?? "")?.type ?? "consonant";
}

export function resolveImpactGroupId(lesson: Lesson): SpanishContrastLevel {
  const ipa = ipaFromLessonTitle(lesson.title);
  if (!ipa) return "similar";
  return getSpanishContrast(ipa).level;
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

export function headerStatsLine(
  inProgressCount: number,
  totalCount: number,
  groupBy: SoundLabGrouping = "impact",
): string {
  const contextHint =
    groupBy === "impact"
      ? " · sonidos de mayor impacto primero"
      : "";
  if (inProgressCount > 0) {
    return `${inProgressCount} de ${totalCount} sonidos en curso${contextHint}`;
  }
  if (totalCount === 1) {
    return `1 sonido listo para practicar${contextHint}`;
  }
  return `${totalCount} sonidos listos para practicar${contextHint}`;
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

export interface SoundLabSectionData {
  id: string;
  title: string;
  subtitle?: string;
  count?: number;
  category?: string;
  lessons: Lesson[];
}

export function buildLessonSections(
  filtered: Lesson[],
  groupBy: SoundLabGrouping,
): SoundLabSectionData[] {
  if (filtered.length === 0) return [];

  if (groupBy === "impact") {
    const buckets = new Map<string, Lesson[]>(
      CONTRAST_GROUP_SECTIONS.map((g) => [g.id, []]),
    );

    for (const lesson of filtered) {
      const impactId = resolveImpactGroupId(lesson);
      const list = buckets.get(impactId) ?? buckets.get("similar")!;
      list.push(lesson);
      buckets.set(impactId, list);
    }

    return CONTRAST_GROUP_SECTIONS.map((g) => ({
      id: g.id,
      title: g.title,
      subtitle: g.subtitle,
      count: buckets.get(g.id)?.length ?? 0,
      lessons: buckets.get(g.id) ?? [],
    })).filter((s) => s.lessons.length > 0);
  }

  const buckets = new Map<string, Lesson[]>(
    ALL_GROUP_SECTIONS.map((g) => [g.id, []]),
  );

  for (const lesson of filtered) {
    const groupId = resolveGroupId(lesson);
    const list = buckets.get(groupId) ?? buckets.get("consonant")!;
    list.push(lesson);
    buckets.set(groupId, list);
  }

  return ALL_GROUP_SECTIONS.map((g) => ({
    id: g.id,
    title: g.title,
    count: buckets.get(g.id)?.length ?? 0,
    lessons: buckets.get(g.id) ?? [],
  })).filter((s) => s.lessons.length > 0);
}
