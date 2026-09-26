import type { CefrLevelId } from "@/lib/courses/types";

export const ASSESSMENT_LEVEL_ORDER: CefrLevelId[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

export function assessmentAnchorIndex(level: CefrLevelId, sections: readonly { level: CefrLevelId }[]): number {
  const levelIndex = sections.findIndex((section) => section.level === level);
  return Math.max(0, levelIndex - 1);
}

export function groupQuestionsByLevel<T extends { level: CefrLevelId }>(
  questions: T[],
): Array<{ level: CefrLevelId; questions: T[] }> {
  return ASSESSMENT_LEVEL_ORDER
    .map((level) => ({ level, questions: questions.filter((question) => question.level === level) }))
    .filter((section) => section.questions.length > 0);
}
