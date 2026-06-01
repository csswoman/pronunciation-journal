import type { CategoryMeta, LessonViewModel, LexiconDomainId } from "./types";

export interface LexiconDomain {
  id: LexiconDomainId;
  name: string;
  description: string;
  color: string;
  icon: string;
  categoryIds: string[];
}

export const LEXICON_DOMAINS: LexiconDomain[] = [
  {
    id: "engineering",
    name: "Engineering",
    description: "AI, backend, data, and frontend vocabulary.",
    color: "#D97706",
    icon: "⬡",
    categoryIds: [
      "artificial-intelligence",
      "backend-infra",
      "data-science",
      "frontend-dev",
    ],
  },
  {
    id: "design",
    name: "Design",
    description: "UX, UI, and design-systems language.",
    color: "#6B9FC4",
    icon: "✦",
    categoryIds: ["ux-design", "design-systems"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Workplace English, interviews, and technical writing.",
    color: "#C4846B",
    icon: "◈",
    categoryIds: ["professional", "technical-writing", "personal-interview"],
  },
  {
    id: "leisure",
    name: "Leisure & life",
    description: "Travel, hobbies, and everyday topics — more coming soon.",
    color: "#65A87A",
    icon: "☼",
    categoryIds: [],
  },
];

export function domainForCategory(categoryId: string): LexiconDomainId {
  const found = LEXICON_DOMAINS.find((d) => d.categoryIds.includes(categoryId));
  return found?.id ?? "professional";
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
