"use client";

import type { AssessmentResult } from "@/lib/courses/assessment";

const GUEST_PLACEMENT_KEY = "assessment:guest:placement:placement";
const claims = new Map<string, Promise<boolean>>();

interface StoredGuestAssessment extends AssessmentResult {
  completedAt?: string;
}

async function claim(userId: string): Promise<boolean> {
  const raw = window.localStorage.getItem(GUEST_PLACEMENT_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as StoredGuestAssessment;
    const { completedAt, ...candidate } = parsed;
    const [{ AssessmentPayloadSchema }, { persistAssessmentConceptProfile }] = await Promise.all([
      import("@/lib/courses/assessment-schema"),
      import("@/lib/courses/assessment-profile"),
    ]);
    const validated = AssessmentPayloadSchema.safeParse(candidate);
    if (!validated.success) return false;

    const result = validated.data as AssessmentResult;
    const response = await fetch("/api/assessment/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "placement",
        evaluatedLevel: result.conceptSignals.at(-1)?.level ?? null,
        result,
      }),
    });
    if (!response.ok) return false;

    await persistAssessmentConceptProfile(userId, result.conceptSignals, result.assignedLevel);
    window.localStorage.setItem(
      `assessment:${userId}:placement:placement`,
      JSON.stringify({ ...result, completedAt: completedAt ?? new Date().toISOString() }),
    );
    window.localStorage.removeItem(GUEST_PLACEMENT_KEY);
    return true;
  } catch {
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
