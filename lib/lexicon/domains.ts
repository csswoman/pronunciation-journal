import type { CategoryMeta, LessonViewModel, LexiconDomainId, StudyMode } from "./types";

export type { StudyMode };

export interface LexiconDomain {
  id: LexiconDomainId;
  name: string;
  description: string;
  color: string;
  icon: string;
  categoryIds: string[];
  /**
   * Technical/referential vocabulary (engineering, design) is receptive:
   * the value is recognition at reading speed, not collocation. Workplace
   * production vocabulary (interviews, writing) is productive: it demands
   * active recall. See plans/077-dictionary-domain-profile.md phase 3.
   */
  studyMode: StudyMode;
}

export const LEXICON_DOMAINS: LexiconDomain[] = [
  {
    id: "engineering",
    name: "Ingeniería",
    description: "Entenderlas al leer documentación o escuchar una reunión.",
    color: "#D97706",
    icon: "⬡",
    categoryIds: [
      "artificial-intelligence",
      "backend-infra",
      "data-science",
      "frontend-dev",
    ],
    studyMode: "receptive",
  },
  {
    id: "design",
    name: "Diseño",
    description: "Lenguaje de UX, UI y sistemas de diseño.",
    color: "#6B9FC4",
    icon: "✦",
    categoryIds: ["ux-design", "design-systems"],
    studyMode: "receptive",
  },
  {
    id: "professional",
    name: "Profesional",
    description: "Inglés laboral, entrevistas y redacción técnica.",
    color: "#C4846B",
    icon: "◈",
    categoryIds: ["professional", "technical-writing", "personal-interview"],
    studyMode: "productive",
  },
  {
    id: "leisure",
    name: "Ocio y vida",
    description: "Viajes, aficiones y temas cotidianos.",
    color: "#65A87A",
    icon: "☼",
    categoryIds: [],
    studyMode: "productive",
  },
];

export function domainForCategory(categoryId: string): LexiconDomainId {
  const found = LEXICON_DOMAINS.find((d) => d.categoryIds.includes(categoryId));
  return found?.id ?? "professional";
}

/** Defaults to "productive" — the same fallback domainForCategory uses ("professional"). */
export function studyModeForCategory(categoryId: string): StudyMode {
  const found = LEXICON_DOMAINS.find((d) => d.categoryIds.includes(categoryId));
  return found?.studyMode ?? "productive";
}

export function groupLessonsByDomain(
  lessons: LessonViewModel[],
  categories: CategoryMeta[]
): { domain: LexiconDomain; lessons: LessonViewModel[] }[] {
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const domainByCategory = new Map(
    categories.map((c) => [c.id, c.domain ?? domainForCategory(c.id)])
  );

  return LEXICON_DOMAINS.map((domain) => {
    const ids =
      domain.categoryIds.length > 0
        ? domain.categoryIds
        : categories
            .filter((c) => domainByCategory.get(c.id) === domain.id)
            .map((c) => c.id);

    const grouped = ids
      .map((id) => byId.get(id))
      .filter((l): l is LessonViewModel => Boolean(l));

    return { domain, lessons: grouped };
  }).filter((g) => g.lessons.length > 0 || g.domain.id === "leisure");
}

export function aggregateDomainStats(lessons: LessonViewModel[]) {
  const totalWords = lessons.reduce((s, l) => s + l.totalWords, 0);
  const learned = lessons.reduce((s, l) => s + l.wordsCompleted, 0);
  const inProgress = lessons.reduce((s, l) => s + l.wordsReviewing, 0);
  const progress =
    totalWords > 0 ? Math.round((learned / totalWords) * 100) : 0;
  return { totalWords, learned, inProgress, progress };
}
