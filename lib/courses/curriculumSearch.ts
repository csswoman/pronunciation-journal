import { COURSE_PATH_CURRICULUM } from "./curriculum";
import { studyLessonPath } from "./curriculumIndex";
import type { CoursePathLevel, CoursePathTrackId } from "./types";

export interface CurriculumSearchHit {
  id: string;
  title: string;
  subtitle: string;
  levelLabel: string;
  levelId: CoursePathTrackId;
  lessonNumber?: number;
  type: "lesson" | "scenario";
  href: string;
  matchContext?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface SearchableItem {
  hit: CurriculumSearchHit;
  searchableContent: string;
}

function buildSearchIndex(): SearchableItem[] {
  const items: SearchableItem[] = [];
  const allLevels: CoursePathLevel[] = [
    ...COURSE_PATH_CURRICULUM.levels,
    ...COURSE_PATH_CURRICULUM.electiveTracks,
  ];

  for (const level of allLevels) {
    const levelLabel = level.spineLabel || (level.isElective ? "Electiva" : level.id.toUpperCase());

    // 1. Lessons
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        const lessonTitle = lesson.title;
        const lessonNumber = lesson.number;
        const subtitle = `${unit.label} · Lección ${lessonNumber}`;
        const href = studyLessonPath(level.id, lessonNumber);

        const searchableParts = [
          lessonTitle,
          lesson.slug ?? "",
          lesson.topicId ?? "",
          unit.title,
          unit.label,
          `leccion ${lessonNumber}`,
          `lesson ${lessonNumber}`,
          levelLabel,
          level.title,
        ];

        items.push({
          hit: {
            id: `lesson-${level.id}-${lesson.id}`,
            title: lessonTitle,
            subtitle,
            levelLabel,
            levelId: level.id,
            lessonNumber,
            type: "lesson",
            href,
          },
          searchableContent: normalizeText(searchableParts.join(" ")),
        });
      }
    }

    // 2. Real Life Scenarios
    if (level.realLife && level.realLife.length > 0) {
      for (const scenario of level.realLife) {
        const vocabWords = scenario.vocab.map((v) => `${v.word} ${v.meaning}`).join(" ");
        const phrases = scenario.phrases.join(" ");
        const subtitle = `Situaciones cotidianas · ${levelLabel}`;
        const href = level.id === "a1" ? "/courses" : `/courses?level=${level.id}`;

        const searchableParts = [
          scenario.title,
          vocabWords,
          phrases,
          "situacion real",
          "real life",
          "contexto",
          levelLabel,
        ];

        items.push({
          hit: {
            id: `scenario-${level.id}-${scenario.id}`,
            title: scenario.title,
            subtitle,
            levelLabel,
            levelId: level.id,
            type: "scenario",
            href,
            matchContext: scenario.phrases[0],
          },
          searchableContent: normalizeText(searchableParts.join(" ")),
        });
      }
    }
  }

  return items;
}

let cachedIndex: SearchableItem[] | null = null;

function getSearchIndex(): SearchableItem[] {
  if (!cachedIndex) {
    cachedIndex = buildSearchIndex();
  }
  return cachedIndex;
}

export function searchCurriculum(query: string, limit = 8): CurriculumSearchHit[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const index = getSearchIndex();
  const results: { hit: CurriculumSearchHit; score: number }[] = [];

  for (const item of index) {
    const content = item.searchableContent;
    const titleNorm = normalizeText(item.hit.title);

    let matchAll = true;
    let score = 0;

    for (const term of terms) {
      if (!content.includes(term)) {
        matchAll = false;
        break;
      }

      // Title exact or start match gets higher score
      if (titleNorm.startsWith(term)) {
        score += 10;
      } else if (titleNorm.includes(term)) {
        score += 5;
      } else {
        score += 1;
      }
    }

    if (matchAll) {
      results.push({ hit: item.hit, score });
    }
  }

  // Sort by score descending, then by lesson number if available
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return 0;
  });

  return results.slice(0, limit).map((r) => r.hit);
}
