import { db } from "@/lib/db";
import type { ClientAssessmentQuestion } from "./assessment";
import type { AssessmentConcept, ConceptSelfRating } from "./concept-profile";
import type { CefrLevelId } from "./types";

export interface AssessmentDraft {
  answers: Record<string, number>;
  selfRatings: Record<string, ConceptSelfRating>;
  sectionIndex: number;
  placementStartIndex: number;
  questionIndex: number;
  placementStep: "level" | "inventory" | "questions";
  selfReportedLevel: CefrLevelId | "unsure" | "full" | null;
}

export function assessmentDraftKey(params: {
  userId?: string;
  mode: "placement" | "checkpoint";
  checkpointLabel?: string;
}): string {
  return `assessment-draft:${params.userId ?? "guest"}:${params.mode}:${params.checkpointLabel ?? "placement"}`;
}

export function assessmentDraftSignature(
  questions: ClientAssessmentQuestion[],
  concepts: AssessmentConcept[],
): string {
  return JSON.stringify({
    questions: questions.map(({ id, level, options, prompt }) => [id, level, options, prompt]),
    concepts: concepts.map(({ lessonSlug, level }) => [lessonSlug, level]),
  });
}

export async function readAssessmentDraft(key: string, signature: string): Promise<AssessmentDraft | null> {
  const row = await db.practicePrefs.get(key);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { signature?: string; draft?: AssessmentDraft };
    return parsed.signature === signature && parsed.draft ? parsed.draft : null;
  } catch {
    return null;
  }
}

export async function saveAssessmentDraft(key: string, signature: string, draft: AssessmentDraft): Promise<void> {
  await db.practicePrefs.put({ key, value: JSON.stringify({ signature, draft }), updatedAt: new Date().toISOString() });
}

export async function clearAssessmentDraft(key: string): Promise<void> {
  await db.practicePrefs.delete(key);
}
