import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import { listTargetsByCefr } from "@/lib/pronunciation/targets/registry";
import type { CefrLevel } from "@/lib/essential-words/types";

/**
 * Turns the authored course path and the pronunciation target registry into
 * short, level-scoped hint lists the coach starters feed to the model, so
 * "teach me something new" and the pronunciation starter draw from real
 * syllabus content instead of hardcoded topic strings — and avoid repeating
 * what the learner has already seen.
 */

const TRACK_BY_LEVEL: Record<CefrLevel, string> = {
  A1: "a1",
  A2: "a2",
  B1: "b1",
  B2: "b2",
  C1: "c1",
};

/** Loose-match a lesson title against a list of recently covered topic strings. */
function coveredRecently(title: string, exclude: readonly string[]): boolean {
  const t = title.toLowerCase();
  return exclude.some((e) => {
    const x = e.trim().toLowerCase();
    return x.length > 3 && (t.includes(x) || x.includes(t));
  });
}

/**
 * Priority grammar/vocabulary lesson titles for a level, minus anything the
 * learner covered recently. Capped so the prompt stays small.
 */
export function grammarTopicsForLevel(
  level: CefrLevel,
  exclude: readonly string[] = [],
  limit = 8,
): string[] {
  const trackId = TRACK_BY_LEVEL[level];
  const track = COURSE_PATH_CURRICULUM.levels.find((l) => l.id === trackId);
  if (!track) return [];

  const titles: string[] = [];
  for (const unit of track.units) {
    for (const lesson of unit.lessons) {
      if (lesson.isOptional) continue;
      if (coveredRecently(lesson.title, exclude)) continue;
      const label = lesson.keywords
        ? `${lesson.title} (${lesson.keywords})`
        : lesson.title;
      if (!titles.includes(label)) titles.push(label);
      if (titles.length >= limit) return titles;
    }
  }
  return titles;
}

/**
 * Pronunciation target labels appropriate at or below a level, easiest first.
 * These are the same canonical targets the Sound Lab and pronunciation path use.
 */
export function soundLabelsForLevel(level: CefrLevel, limit = 8): string[] {
  return listTargetsByCefr(level)
    .map((t) => t.label)
    .slice(0, limit);
}
