"use client";

import type { AssessmentResult } from "@/lib/courses/assessment";
import type { ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";

const GUEST_PLACEMENT_KEY = "assessment:guest:placement:placement";
const GUEST_PLACEMENT_POSTED_KEY = "assessment:guest:placement:posted";
const claims = new Map<string, Promise<boolean>>();

export interface StoredGuestAssessment extends AssessmentResult {
  completedAt?: string;
  answers?: Record<string, number>;
  selfRatings?: Record<string, ConceptSelfRating>;
  checkpointLevel?: CefrLevelId;
}

async function claim(userId: string): Promise<boolean> {
  const raw = window.localStorage.getItem(GUEST_PLACEMENT_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as StoredGuestAssessment;
    const { completedAt, answers, selfRatings, checkpointLevel, ...candidate } = parsed;
    const [{ AssessmentPayloadSchema }, { persistAssessmentConceptProfile }] = await Promise.all([
      import("@/lib/courses/assessment-schema"),
      import("@/lib/courses/assessment-profile"),
    ]);
    const validated = AssessmentPayloadSchema.safeParse(candidate);
    if (!validated.success) return false;

    const result = validated.data as AssessmentResult;
    const postedMark = completedAt ?? "unknown";
    const alreadyPosted = window.localStorage.getItem(GUEST_PLACEMENT_POSTED_KEY) === postedMark;

    if (!alreadyPosted) {
      const response = await fetch("/api/assessment/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "placement",
          evaluatedLevel: result.conceptSignals.at(-1)?.level ?? null,
          answers,
          selfRatings,
          checkpointLevel,
          result,
        }),
      });
      if (!response.ok) {
        console.error("[guest-assessment] claim POST failed", response.status);
        return false;
      }
      window.localStorage.setItem(GUEST_PLACEMENT_POSTED_KEY, postedMark);
    }

    await persistAssessmentConceptProfile(userId, result.conceptSignals, result.assignedLevel);
    window.localStorage.setItem(
      `assessment:${userId}:placement:placement`,
      JSON.stringify({ ...result, completedAt: completedAt ?? new Date().toISOString() }),
    );
    window.localStorage.removeItem(GUEST_PLACEMENT_KEY);
    window.localStorage.removeItem(GUEST_PLACEMENT_POSTED_KEY);
    return true;
  } catch (error) {
    console.error("[guest-assessment] claim failed", error);
    return false;
  }
}

/** Claims a public placement result once the browser has an authenticated user. */
export function claimGuestPlacement(userId: string): Promise<boolean> {
  const existing = claims.get(userId);
  if (existing) return existing;

  const pending = claim(userId).finally(() => claims.delete(userId));
  claims.set(userId, pending);
  return pending;
}
